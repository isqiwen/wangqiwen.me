import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const packagePath = require.resolve("next/package.json");
const packageRoot = path.dirname(packagePath);

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

// Execute the actual installed dependency's scan block, not a copied replacement
// algorithm. Only filesystem discovery/metadata I/O are stubbed. Controlled await
// points reproduce the request window without timing sleeps or retrying requests.
async function startScan(flavour: "cjs" | "esm") {
  const source = await readFile(path.join(packageRoot,
    `dist/${flavour === "esm" ? "esm/" : ""}server/lib/router-utils/setup-dev-bundler.js`), "utf8");
  const start = source.search(/            const (?:\{ appFiles, pageFiles \}|appFiles = new Set\(\))/);
  const end = source.indexOf("            const numConflicting = conflictingAppPagePaths.size;", start);
  assert.ok(start >= 0 && end > start, "Review the version-pinned route snapshot patch when upgrading Next.js.");

  const appFiles = new Set(["/api/editor", "/editor", "/removed"]);
  const pageFiles = new Set(["/legacy"]);
  const devPageFiles = new Set(["/fixture/app/old.tsx"]);
  const first = deferred();
  const firstEntered = deferred();
  const second = deferred();
  const secondEntered = deferred();
  const isMiddlewareFile = (file: string) => file === "/middleware";
  const isInstrumentationHookFile = () => false;
  const normalizePathSep = (file: string) => file;
  const absolutePathToPage = (file: string, options: { dir: string }) =>
    file.slice(options.dir.length).replace(/\.[^.]+$/, "");
  const normalizeAppPath = (file: string) => file.replace(/\/(page|route)$/, "");
  const getStaticInfoIncludingLayouts = async () => {
    firstEntered.resolve(); await first.promise; return {};
  };
  const getPageStaticInfo = async () => {
    secondEntered.resolve(); await second.promise; return {};
  };
  const isMetadataRouteFile = (file: string) => file.includes("opengraph-image");
  const sortByPageExts = () => () => 0;
  const isParallelRouteSegment = () => false;
  const normalizeMetadataPageToRoute = (file: string) => file;
  const ensureLeadingSlash = (file: string) => file;
  const knownFiles = new Map([
    "/fixture/middleware.tsx", "/fixture/app/api/editor/route.ts",
    "/fixture/app/editor/page.tsx", "/fixture/app/opengraph-image.tsx",
    "/fixture/app/added/page.tsx", "/fixture/pages/new-page.tsx",
  ].map(file => [file, { accuracy: 1, timestamp: 1 }]));

  const context = {
    Set, Map, opts: { fsChecker: { appFiles, pageFiles, nextDataRoutes: new Set() }, turbo: true },
    dir: "/fixture", appDir: "/fixture/app", pagesDir: "/fixture/pages",
    files: ["/fixture/middleware.tsx"], directories: ["/fixture/app", "/fixture/pages"],
    knownFiles, fileWatchTimes: new Map(), envFiles: [], tsconfigPaths: [],
    nextConfig: { output: "standalone", pageExtensions: ["ts", "tsx"] },
    validFileMatcher: {
      isPageFile: () => true, isRootNotFound: () => false, isAppLayoutPage: () => false,
      isAppRouterPage: (file: string) => /\/(page|route)\./.test(file),
      isAppRouterRoute: (file: string) => /\/route\./.test(file),
    },
    useFileSystemPublicRoutes: true, serverFields: {}, propagateServerField: async () => {},
    appPaths: {}, pageNameSet: new Set(), conflictingAppPagePaths: new Set(),
    appPageFilePaths: new Map(), pagesPageFilePaths: new Map(), nestedMiddleware: [],
    slots: [], layoutRoutes: [], appRoutes: [], appRouteHandlers: [], pageRoutes: [], pageApiRoutes: [], routedPages: [],
    enabledTypeScript: false, hasRootAppNotFound: false, middlewareMatchers: undefined,
    // CommonJS and ESM exports of the same installed scanner are both exercised.
    devPageFiles, _shared1: { devPageFiles },
    isMiddlewareFile, isInstrumentationHookFile, _utils1: { isMiddlewareFile, isInstrumentationHookFile },
    normalizePathSep, _normalizepathsep: { normalizePathSep },
    absolutePathToPage, _absolutepathtopage: { absolutePathToPage },
    normalizeAppPath, _apppaths: { normalizeAppPath },
    getStaticInfoIncludingLayouts, sortByPageExts, _entries: { getStaticInfoIncludingLayouts, sortByPageExts },
    getPageStaticInfo, _getpagestaticinfo: { getPageStaticInfo },
    isMetadataRouteFile, _ismetadataroute: { isMetadataRouteFile },
    isParallelRouteSegment, _segment: { isParallelRouteSegment },
    normalizeMetadataPageToRoute, _getmetadataroute: { normalizeMetadataPageToRoute },
    ensureLeadingSlash, _ensureleadingslash: { ensureLeadingSlash },
    PAGE_TYPES: { ROOT: "root", APP: "app", PAGES: "pages" },
    _pagetypes: { PAGE_TYPES: { ROOT: "root", APP: "app", PAGES: "pages" } },
  };
  const completed = vm.runInNewContext(`(async () => {${source.slice(start, end)}\n})()`, context) as Promise<void>;
  // Mark rejected promises handled even before a test reaches its final assertion.
  void completed.catch(() => {});
  return { appFiles, pageFiles, devPageFiles, first, firstEntered, second, secondEntered, completed };
}

for (const flavour of ["cjs", "esm"] as const) {
  test(`${flavour}: route tables remain complete across metadata awaits and publish in place`, async () => {
    const scan = await startScan(flavour);
    const app = ["/api/editor", "/editor", "/removed"];
    const pages = ["/legacy"];
    const dev = ["/fixture/app/old.tsx"];
    await scan.firstEntered.promise;
    assert.deepEqual([...scan.appFiles], app);
    assert.deepEqual([...scan.pageFiles], pages);
    assert.deepEqual([...scan.devPageFiles], dev);
    scan.first.resolve();
    await scan.secondEntered.promise;
    assert.deepEqual([...scan.appFiles], app, "Requests must not see a half-populated route table.");
    assert.deepEqual([...scan.pageFiles], pages);
    assert.deepEqual([...scan.devPageFiles], dev);
    scan.second.resolve();
    await scan.completed;
    assert.deepEqual([...scan.appFiles], ["/api/editor", "/editor", "/added"]);
    assert.deepEqual([...scan.pageFiles], ["/new-page"]);
    assert.ok(!scan.devPageFiles.has("/fixture/app/old.tsx"));
    assert.ok(scan.devPageFiles.has("/fixture/app/api/editor/route.ts"));
  });

  test(`${flavour}: a failed scan cannot erase the last usable route snapshot`, async () => {
    const scan = await startScan(flavour);
    scan.first.resolve();
    await scan.secondEntered.promise;
    scan.second.reject(new Error("fixture metadata read failed"));
    await assert.rejects(scan.completed, /fixture metadata read failed/);
    assert.deepEqual([...scan.appFiles], ["/api/editor", "/editor", "/removed"]);
    assert.deepEqual([...scan.pageFiles], ["/legacy"]);
    assert.deepEqual([...scan.devPageFiles], ["/fixture/app/old.tsx"]);
  });
}
