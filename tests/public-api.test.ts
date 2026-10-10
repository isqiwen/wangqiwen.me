import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET as getHealth } from "@/app/api/health/route";
import { GET as getPostViews } from "@/app/api/posts/views/route";
import { GET as getView } from "@/app/api/view/route";
import { getPosts } from "@/app/get-posts";

// Each caller gets its own rate-limit bucket.
function request(path: string, ip: string) {
  return new NextRequest(`http://127.0.0.1${path}`, {
    headers: { "x-forwarded-for": ip },
  });
}

test("a visit is recorded once and then only read back", async () => {
  const [post] = await getPosts();
  const ip = "203.0.113.10";

  const first = await getView(request(`/api/view?id=${post.id}&incr=1`, ip));
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("cache-control"), "no-store");
  const { views } = (await first.json()) as { id: string; views: number };
  assert.ok(views >= 1);

  // Reloading the page within the window does not count again.
  const reload = await getView(request(`/api/view?id=${post.id}&incr=1`, ip));
  assert.deepEqual(await reload.json(), { id: post.id, views });

  const read = await getView(request(`/api/view?id=${post.id}`, ip));
  assert.deepEqual(await read.json(), { id: post.id, views });

  // Another reader does count.
  const other = await getView(
    request(`/api/view?id=${post.id}&incr=1`, "203.0.113.11")
  );
  assert.deepEqual(await other.json(), { id: post.id, views: views + 1 });
});

test("rejects malformed and unknown post ids", async () => {
  for (const query of ["", "?id=", "?id=Not_A_Slug", "?id=no-such-post"]) {
    const response = await getView(
      request(`/api/view${query}`, "203.0.113.20")
    );
    assert.equal(response.status, 400, query);
    assert.ok(((await response.json()) as { error?: unknown }).error, query);
  }
});

test("limits how often one address may ask for a count", async () => {
  const [post] = await getPosts();
  const ip = "203.0.113.30";
  let status = 200;

  for (let attempt = 0; attempt < 121 && status === 200; attempt += 1) {
    status = (await getView(request(`/api/view?id=${post.id}`, ip))).status;
  }

  assert.equal(status, 429);
});

test("answers list counts for published posts only", async () => {
  const [post] = await getPosts();
  const ip = "203.0.113.40";

  const response = await getPostViews(
    request(`/api/posts/views?ids=${post.id},no-such-post,Not_A_Slug`, ip)
  );
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys((await response.json()) as object), [post.id]);

  assert.deepEqual(
    await (await getPostViews(request("/api/posts/views", ip))).json(),
    {}
  );
  const tooMany = Array.from({ length: 101 }, (_, index) => `post-${index}`);
  assert.equal(
    (await getPostViews(request(`/api/posts/views?ids=${tooMany}`, ip))).status,
    400
  );
});

test("health answers 200 with the state of the optional store", async () => {
  const response = await getHealth();
  const body = (await response.json()) as { status: string; views: string };

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.views, "ok");
});
