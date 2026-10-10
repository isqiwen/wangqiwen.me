#!/usr/bin/env node

import { relative } from "node:path";
import {
  PostsValidationError,
  syncPostsMetadata,
} from "../../utils/server/sync-posts";

async function main() {
  const args = process.argv.slice(2);
  const isSilent = args.includes("--silent");
  const isCheck = args.includes("--check");

  const { changedFiles } = await syncPostsMetadata({
    publishedOnly: args.includes("--published-only"),
    normalizeSources: true,
    check: isCheck,
  });

  if (!isCheck) {
    if (!isSilent) {
      console.log("Post metadata normalized and manifest updated.");
    }
    return;
  }

  if (changedFiles.length > 0) {
    console.error(
      "Posts metadata or manifest need to be synchronized:\n" +
        changedFiles
          .map(file => ` - ${relative(process.cwd(), file)}`)
          .join("\n")
    );
    process.exitCode = 1;
  } else if (!isSilent) {
    console.log("Posts metadata are up to date.");
  }
}

main().catch(error => {
  console.error(error instanceof PostsValidationError ? error.message : error);
  process.exitCode = 1;
});
