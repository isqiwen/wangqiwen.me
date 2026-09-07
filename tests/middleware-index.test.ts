import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

// Node's test runner isolates test files. Keep these subtests sequential because
// this fixture changes cwd and NODE_ENV for the middleware's runtime reads.
test("middleware uses the live index without weakening access boundaries", async t => {
  const originalDirectory = process.cwd();
  const originalEnvironment = process.env.NODE_ENV;
  const root = await mkdtemp(join(tmpdir(), "middleware-index-"));
  await mkdir(join(root, "posts"));
  process.chdir(root);
  const file = join(root, "posts", "manifest.json");
  const request = () => new NextRequest("http://127.0.0.1:3101/2092/index-fixture");
  const index = (status: string) => writeFile(file, JSON.stringify({
    posts: [{ path: "/2092/index-fixture", status }],
  }));
  const mode = (value: string) => Object.assign(process.env, { NODE_ENV: value });

  try {
    await t.test("a publication change is read without re-importing middleware", async () => {
      mode("production");
      await index("published");
      assert.equal((await middleware(request())).headers.get("x-middleware-next"), "1");
      await index("archived");
      assert.equal((await middleware(request())).status, 404);
      await index("published");
      assert.equal((await middleware(request())).headers.get("x-middleware-next"), "1");
    });

    await t.test("drafts remain local and archived articles stay unavailable", async () => {
      await index("draft");
      mode("development");
      assert.equal((await middleware(request())).headers.get("x-middleware-next"), "1");
      mode("production");
      assert.equal((await middleware(request())).status, 404);
      for (const environment of ["development", "production"]) {
        mode(environment);
        await index("archived");
        assert.equal((await middleware(request())).status, 404);
      }
    });

    await t.test("an unknown article fails closed", async () => {
      await writeFile(file, JSON.stringify({ posts: [] }));
      assert.equal((await middleware(request())).status, 404);
    });

    await t.test("missing, malformed and invalid indexes return an uncached 503", async () => {
      await rm(file);
      for (const contents of [null, "{broken", '{"posts":{}}', '{"posts":[{"path":"/2092/index-fixture","status":"unknown"}]}']) {
        if (contents !== null) await writeFile(file, contents);
        const response = await middleware(request());
        assert.equal(response.status, 503);
        assert.equal(response.headers.get("cache-control"), "no-store");
      }
    });

    await t.test("editor access does not depend on a readable article index", async () => {
      await writeFile(file, "{broken");
      mode("development");
      assert.equal((await middleware(new NextRequest("http://127.0.0.1:3101/editor"))).headers.get("x-middleware-next"), "1");
      const crossSite = new NextRequest("http://127.0.0.1:3101/api/editor", {
        method: "POST", headers: { origin: "https://untrusted.example" },
      });
      assert.equal((await middleware(crossSite)).status, 403);
      mode("production");
      for (const path of ["/editor", "/api/editor", "/api/editor/publish"]) {
        assert.equal((await middleware(new NextRequest(`http://127.0.0.1:3101${path}`))).status, 404);
      }
    });
  } finally {
    process.chdir(originalDirectory);
    if (originalEnvironment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else mode(originalEnvironment);
    await rm(root, { recursive: true, force: true });
  }
});
