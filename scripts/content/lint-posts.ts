#!/usr/bin/env node

import {
  collectSourcePosts,
  PostsValidationError,
  validateSourcePosts,
} from "../../utils/server/sync-posts";

async function main() {
  const { posts, issues } = await collectSourcePosts();
  const errors = [...issues, ...validateSourcePosts(posts)];

  if (errors.length > 0) {
    console.error(new PostsValidationError(errors).message);
    process.exitCode = 1;
    return;
  }

  console.log("All post metadata and content quality checks passed.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
