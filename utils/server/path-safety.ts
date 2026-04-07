import path from "path";

// `startsWith()` is not enough for path validation on Windows because sibling
// directories like `E:\repo-other` also start with `E:\repo`.
export function assertPathInside(rootDir: string, target: string) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Invalid path");
  }
}

export function resolvePathInside(rootDir: string, inputPath: string) {
  const resolved = path.resolve(rootDir, inputPath);
  assertPathInside(rootDir, resolved);
  return resolved;
}
