#!/usr/bin/env node

import { constants } from "node:fs";
import { access, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { relative, resolve } from "node:path";
import { fetchTweet } from "react-tweet/api";
import {
  extractExternalReferences,
  type ExternalReference,
  type ExternalReferenceKind,
} from "../../utils/external-links";

const require = createRequire(import.meta.url);
const { collectPosts } = require("./lib/posts") as {
  collectPosts: () => Promise<Map<string, { path: string; source: string }>>;
};

const REQUEST_TIMEOUT_MS = 12_000;
const CONCURRENCY = 4;

type Reference = ExternalReference & {
  file: string;
};

type CheckStatus = "ok" | "broken" | "unverified";

type CheckResult = {
  kind: ExternalReferenceKind;
  value: string;
  status: CheckStatus;
  reason: string;
  references: Reference[];
};

async function main() {
  const reportDirectory = getArgument("--report-dir");
  const entries = await collectPosts();
  const references = [...entries.values()].flatMap(entry =>
    extractExternalReferences(entry.source).map(reference => ({
      ...reference,
      file: relative(process.cwd(), entry.path),
    }))
  );
  const targets = groupReferences(references);
  const results = await mapWithConcurrency(
    targets,
    CONCURRENCY,
    checkReference
  );
  const report = buildReport(results);

  if (reportDirectory) {
    await mkdir(reportDirectory, { recursive: true });
    await Promise.all([
      writeFile(
        resolve(reportDirectory, "report.json"),
        `${JSON.stringify(report, null, 2)}\n`
      ),
      writeFile(resolve(reportDirectory, "report.md"), formatMarkdown(report)),
    ]);
    console.log(`External link report written to ${reportDirectory}`);
    return;
  }

  process.stdout.write(formatMarkdown(report));
}

function groupReferences(references: Reference[]): Reference[][] {
  const groups = new Map<string, Reference[]>();

  for (const reference of references) {
    const key = `${reference.kind}:${reference.value}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(reference);
    } else {
      groups.set(key, [reference]);
    }
  }

  return [...groups.values()];
}

async function checkReference(references: Reference[]): Promise<CheckResult> {
  const [reference] = references;
  const result =
    reference.kind === "tweet"
      ? await checkTweet(reference.value)
      : reference.kind === "image" && reference.value.startsWith("/")
      ? await checkLocalImage(reference.value)
      : await checkHttpUrl(reference.value);

  return {
    ...result,
    kind: reference.kind,
    value: reference.value,
    references,
  };
}

async function checkTweet(
  id: string
): Promise<Pick<CheckResult, "status" | "reason">> {
  try {
    const result = await fetchTweet(id, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (result.tombstone) {
      return { status: "broken", reason: "Tweet is private" };
    }
    if (result.notFound || !result.data) {
      return {
        status: "broken",
        reason: "Tweet was deleted or does not exist",
      };
    }

    return { status: "ok", reason: "Tweet is available" };
  } catch (error) {
    return { status: "unverified", reason: getErrorMessage(error) };
  }
}

async function checkLocalImage(
  value: string
): Promise<Pick<CheckResult, "status" | "reason">> {
  const publicDirectory = resolve(process.cwd(), "public");
  const pathname = new URL(value, "https://health-check.invalid").pathname;
  const target = resolve(publicDirectory, `.${pathname}`);

  if (!target.startsWith(`${publicDirectory}/`)) {
    return {
      status: "broken",
      reason: "Image path escapes the public directory",
    };
  }

  try {
    await access(target, constants.R_OK);
    return { status: "ok", reason: "Local image exists" };
  } catch {
    return {
      status: "broken",
      reason: `Missing local image: ${relative(process.cwd(), target)}`,
    };
  }
}

async function checkHttpUrl(
  value: string
): Promise<Pick<CheckResult, "status" | "reason">> {
  try {
    let response = await request(value, "HEAD");
    if (response.status === 405 || response.status === 501) {
      response = await request(value, "GET");
    }

    if (response.status >= 200 && response.status < 400) {
      return { status: "ok", reason: `HTTP ${response.status}` };
    }
    if (response.status === 404 || response.status === 410) {
      return { status: "broken", reason: `HTTP ${response.status}` };
    }

    return { status: "unverified", reason: `HTTP ${response.status}` };
  } catch (error) {
    return { status: "unverified", reason: getErrorMessage(error) };
  }
}

async function request(url: string, method: "HEAD" | "GET") {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      "User-Agent": "wangqiwen.me-link-checker/1.0",
      ...(method === "GET" ? { Range: "bytes=0-0" } : {}),
    },
  });

  if (method === "GET") {
    void response.body?.cancel();
  }

  return response;
}

async function mapWithConcurrency<T, Result>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<Result>
): Promise<Result[]> {
  const results = new Array<Result>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker())
  );
  return results;
}

function buildReport(results: CheckResult[]) {
  const summary = {
    total: results.length,
    ok: results.filter(result => result.status === "ok").length,
    broken: results.filter(result => result.status === "broken").length,
    unverified: results.filter(result => result.status === "unverified").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    results,
  };
}

function formatMarkdown(report: ReturnType<typeof buildReport>): string {
  const lines = [
    "# External link health",
    "",
    `Checked ${report.summary.total} unique references: ${report.summary.ok} ok, ${report.summary.broken} broken, ${report.summary.unverified} unverified.`,
  ];

  for (const status of ["broken", "unverified"] as const) {
    const results = report.results.filter(result => result.status === status);
    lines.push(
      "",
      `## ${status === "broken" ? "Broken" : "Unverified"} (${results.length})`,
      ""
    );

    if (results.length === 0) {
      lines.push("None.");
      continue;
    }

    lines.push(
      "| Type | Reference | Location | Result |",
      "| --- | --- | --- | --- |"
    );
    for (const result of results) {
      const locations = result.references
        .map(reference => `${reference.file}:${reference.line}`)
        .join("<br>");
      lines.push(
        `| ${result.kind} | ${formatReference(
          result
        )} | ${locations} | ${escapeCell(result.reason)} |`
      );
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatReference(result: CheckResult): string {
  const value =
    result.kind === "tweet"
      ? `https://x.com/i/web/status/${result.value}`
      : result.value;
  return `<${value}>`;
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function getArgument(name: string): string | null {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? null : process.argv[index + 1];
  return value && !value.startsWith("--") ? resolve(value) : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.name === "TimeoutError" ? "Request timed out" : error.message;
  }
  return "Request failed";
}

main().catch(error => {
  console.error("External link check failed.", error);
  process.exitCode = 1;
});
