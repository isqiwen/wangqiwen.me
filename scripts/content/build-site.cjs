#!/usr/bin/env node

const { spawnSync } = require("child_process");
const { join } = require("path");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });

  if (result.error) {
    throw new Error(`${command} could not start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}.`);
  }
}

async function main() {
  let publishOnlyMetadataWritten = false;
  let buildError = null;

  try {
    run(process.execPath, ["scripts/content/lint-posts.cjs"]);

    // The registry is a static set of MDX imports. Restrict it before Next
    // compiles so draft and archived articles do not become public routes.
    run(process.execPath, [
      "scripts/content/sync-posts.cjs",
      "--published-only",
      "--silent",
    ]);
    publishOnlyMetadataWritten = true;
    const buildEnvironment =
      process.env.BUILD_WITH_REMOTE_REDIS === "1"
        ? process.env
        : {
            ...process.env,
            UPSTASH_REDIS_REST_TOKEN: "",
            UPSTASH_REDIS_REST_URL: "",
          };
    run(
      process.execPath,
      [join("node_modules", "next", "dist", "bin", "next"), "build"],
      { env: buildEnvironment }
    );
  } catch (error) {
    buildError = error;
  } finally {
    if (publishOnlyMetadataWritten) {
      try {
        // Keep the working tree ready for local draft editing after the build.
        run(process.execPath, ["scripts/content/sync-posts.cjs", "--silent"]);
      } catch (error) {
        if (!buildError) {
          buildError = error;
        }
      }
    }
  }

  if (buildError) {
    throw buildError;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
