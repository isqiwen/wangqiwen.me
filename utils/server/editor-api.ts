import { NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import { requireLocalEditor } from "@/utils/server/local-editor";
import { PostFileValidationError } from "@/utils/server/post-files";
import { PostPreconditionError } from "@/utils/server/post-version";
import { consumeRateLimitToken, getRequestClientIp } from "@/utils/server/rate-limit";

type EditorRateLimitOptions = {
  action: string;
  limit: number;
  windowMs: number;
};

export function createEditorJsonError(
  action: string,
  message: string,
  status: number,
  error?: unknown,
  extra?: Record<string, unknown>,
) {
  if (status >= 500) {
    logger.error(`[editor:${action}] ${message}`, error ?? "");
  } else {
    logger.warn(`[editor:${action}] ${message}`, extra ?? "");
  }

  return NextResponse.json(
    {
      error: message,
      ...extra,
    },
    { status },
  );
}

export function logEditorInfo(action: string, message: string, extra?: Record<string, unknown>) {
  logger.info(`[editor:${action}] ${message}`, extra ?? "");
}

export function enforceEditorRateLimit(request: Request, options: EditorRateLimitOptions) {
  const clientIp = getRequestClientIp(request);
  const result = consumeRateLimitToken(`editor:${options.action}:${clientIp}`, {
    limit: options.limit,
    windowMs: options.windowMs,
  });

  if (result.allowed) {
    return null;
  }

  logger.warn(`[editor:${options.action}] rate limit exceeded`, {
    clientIp,
    retryAfterSeconds: result.retryAfterSeconds,
  });

  return NextResponse.json(
    {
      error: `Too many ${options.action.replace(/-/g, " ")} requests. Please try again shortly.`,
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}

const NO_STORE = { "Cache-Control": "no-store" };
const ONE_MINUTE_MS = 60 * 1000;

type EditorRouteOptions = {
  // Names the rate-limit bucket and the log line.
  action: string;
  // Requests allowed per minute.
  limit: number;
  // What the author is told when the handler fails unexpectedly.
  failureMessage: string;
  // Answer 404 when the file a handler works on has disappeared.
  missingFileIsNotFound?: boolean;
};

// The checks and error answers every editor endpoint shares: the rate limit,
// the local-only guard, and one mapping from failures to responses.
export function editorRoute(
  options: EditorRouteOptions,
  handler: (request: Request) => Promise<Response>
) {
  return async function handleEditorRequest(request: Request) {
    const rateLimited = enforceEditorRateLimit(request, {
      action: options.action,
      limit: options.limit,
      windowMs: ONE_MINUTE_MS,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const unavailable = requireLocalEditor();
    if (unavailable) {
      return unavailable;
    }

    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof PostPreconditionError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.status, headers: NO_STORE }
        );
      }

      if (error instanceof PostFileValidationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 400, headers: NO_STORE }
        );
      }

      if (
        options.missingFileIsNotFound &&
        (error as NodeJS.ErrnoException | null)?.code === "ENOENT"
      ) {
        return NextResponse.json(
          { error: "not found" },
          { status: 404, headers: NO_STORE }
        );
      }

      return createEditorJsonError(
        options.action,
        options.failureMessage,
        500,
        error
      );
    }
  };
}
