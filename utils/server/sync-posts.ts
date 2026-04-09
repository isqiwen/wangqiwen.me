import { execFile } from "child_process";
import util from "util";
import { join } from "path";

const execFileAsync = util.promisify(execFile);

export async function syncPostsMetadata() {
  return execFileAsync(process.execPath, [join(process.cwd(), "scripts", "normalize-post-metadata.cjs"), "--", "--silent"], {
    cwd: process.cwd(),
    env: process.env,
  });
}
