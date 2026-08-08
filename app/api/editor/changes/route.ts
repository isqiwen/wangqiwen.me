import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { requireLocalEditor } from "@/utils/server/local-editor";
import {
  PostFileValidationError,
  resolvePostFile,
} from "@/utils/server/post-files";
import {
  createEditorJsonError,
  enforceEditorRateLimit,
  logEditorInfo,
} from "@/utils/server/editor-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_CONTENT_BYTES = 2 * 1024 * 1024;
const MAX_DIFF_BUFFER = MAX_CONTENT_BYTES * 4 + 64 * 1024;
const execFileAsync = promisify(execFile);

type CommandError = Error & {
  code?: number | string;
  stdout?: string;
};

export async function POST(req: Request) {
  const rateLimited = enforceEditorRateLimit(req, {
    action: "compare-changes",
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const unavailable = requireLocalEditor();
  if (unavailable) {
    return unavailable;
  }

  try {
    const payload = await req.json();
    if (typeof payload?.content !== "string") {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400, headers: NO_STORE }
      );
    }
    if (Buffer.byteLength(payload.content, "utf8") > MAX_CONTENT_BYTES) {
      return NextResponse.json(
        { error: "content is too large to compare" },
        { status: 413, headers: NO_STORE }
      );
    }

    const postFile = resolvePostFile(payload?.path);
    const savedSource = await readFileIfPresent(postFile.absolutePath);
    if (savedSource === null) {
      return NextResponse.json(
        {
          saved: { available: false, diff: "" },
          git: { available: false, diff: "" },
        },
        { headers: NO_STORE }
      );
    }

    const [savedDiff, gitDiff] = await Promise.all([
      compareSavedContent(postFile.absolutePath, payload.content),
      compareWithGitHead(postFile.absolutePath, postFile.relativePath),
    ]);

    logEditorInfo("compare-changes", "Compared editor post changes.", {
      path: postFile.relativePath,
      hasSavedChanges: Boolean(savedDiff),
      hasGitChanges: Boolean(gitDiff),
    });

    return NextResponse.json(
      {
        saved: { available: true, diff: savedDiff },
        git: { available: true, diff: gitDiff },
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    if (error instanceof PostFileValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: NO_STORE }
      );
    }
    return createEditorJsonError(
      "compare-changes",
      "failed to compare post changes",
      500,
      error
    );
  }
}

async function compareSavedContent(savedPath: string, currentSource: string) {
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "wangqiwen-editor-diff-")
  );
  const currentPath = path.join(temporaryDirectory, "current.mdx");

  try {
    await fs.writeFile(currentPath, currentSource, "utf8");
    const diff = await runDiffCommand("diff", [
      "-u",
      "-L",
      "Saved on disk",
      "-L",
      "Current editor",
      savedPath,
      currentPath,
    ]);
    return diff;
  } finally {
    await fs.rm(temporaryDirectory, { force: true, recursive: true });
  }
}

async function compareWithGitHead(filePath: string, relativePath: string) {
  if (await isTrackedByGit(relativePath)) {
    return runDiffCommand("git", [
      "diff",
      "--no-ext-diff",
      "--unified=3",
      "HEAD",
      "--",
      relativePath,
    ]);
  }

  return runDiffCommand("git", [
    "diff",
    "--no-index",
    "--no-ext-diff",
    "--unified=3",
    "--",
    "/dev/null",
    filePath,
  ]);
}

async function isTrackedByGit(relativePath: string) {
  try {
    await execFileAsync(
      "git",
      ["ls-files", "--error-unmatch", "--", relativePath],
      {
        cwd: process.cwd(),
        maxBuffer: MAX_DIFF_BUFFER,
      }
    );
    return true;
  } catch {
    return false;
  }
}

async function runDiffCommand(command: string, args: string[]) {
  try {
    const { stdout } = await execFileAsync(command, args, {
      cwd: process.cwd(),
      maxBuffer: MAX_DIFF_BUFFER,
    });
    return stdout;
  } catch (error) {
    const commandError = error as CommandError;
    if (commandError.code === 1) {
      return commandError.stdout ?? "";
    }
    throw error;
  }
}

async function readFileIfPresent(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
