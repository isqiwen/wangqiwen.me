import { NextResponse } from "next/server";
import { logger } from "@/utils/logger";
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
