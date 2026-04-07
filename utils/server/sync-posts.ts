import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function syncPostsMetadata() {
  return execAsync("pnpm sync:posts -- --silent", {
    cwd: process.cwd(),
    env: process.env,
  });
}
