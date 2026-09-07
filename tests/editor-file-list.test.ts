import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";
import { collectEditorFiles } from "@/utils/server/editor-files";

async function fixture(t: TestContext) {
  const root = await fs.mkdtemp(path.join(tmpdir(), "editor-file-list-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const directory = path.join(root, "app", "(post)", "2092", "list-fixture");
  await fs.mkdir(directory, { recursive: true });
  const article = path.join(directory, "article.mdx");
  await fs.writeFile(article, 'export const metadata = {"status":"draft"};\n\n## Body\n');
  return { root, directory, article };
}

function ioError(code: string) {
  return Object.assign(new Error(`fixture ${code}`), { code });
}

test("article lists exclude temporary/unrelated files before touching their metadata", async t => {
  const { root, directory } = await fixture(t);
  const temporary = path.join(directory, ".article.mdx.in-flight.tmp");
  await fs.writeFile(temporary, "partial write");
  await fs.writeFile(path.join(directory, "notes.mdx"), "not an article");
  const stat = fs.stat.bind(fs);
  const observed: string[] = [];
  t.mock.method(fs, "stat", async (file: string) => {
    observed.push(String(file));
    if (file === temporary) throw ioError("ENOENT");
    return stat(file);
  });
  const entries = await collectEditorFiles(root);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].path, "app/(post)/2092/list-fixture/article.mdx");
  assert.equal(entries[0].status, "draft");
  assert.equal(entries[0].label, "2092/list-fixture");
  assert.ok(!observed.includes(temporary));
  assert.ok(!observed.some(file => file.endsWith("notes.mdx")));
});

for (const operation of ["stat", "readFile", "readdir"] as const) {
  test(`a disappearing article/directory during ${operation} does not fail the listing`, async t => {
    const { root, directory, article } = await fixture(t);
    const original = fs[operation].bind(fs) as (...args: any[]) => Promise<any>;
    const disappearingPath = operation === "readdir" ? directory : article;
    t.mock.method(fs, operation, async (...args: any[]) => {
      if (String(args[0]) === disappearingPath) throw ioError("ENOENT");
      return original(...args);
    });
    assert.deepEqual(await collectEditorFiles(root), []);
  });
}

for (const operation of ["stat", "readFile", "readdir"] as const) {
  test(`permission errors during ${operation} remain visible to the API`, async t => {
    const { root, directory, article } = await fixture(t);
    const original = fs[operation].bind(fs) as (...args: any[]) => Promise<any>;
    const deniedPath = operation === "readdir" ? directory : article;
    t.mock.method(fs, operation, async (...args: any[]) => {
      if (String(args[0]) === deniedPath) throw ioError("EACCES");
      return original(...args);
    });
    await assert.rejects(collectEditorFiles(root), { code: "EACCES" });
  });
}

test("missing article roots are empty; invalid metadata stays archived and years stay descending", async t => {
  const { root } = await fixture(t);
  const older = path.join(root, "app", "(post)", "2091", "older");
  await fs.mkdir(older, { recursive: true });
  await fs.writeFile(path.join(older, "article.mdx"), "## Missing metadata\n");
  const entries = await collectEditorFiles(root);
  assert.deepEqual(entries.map(entry => entry.label), ["2092/list-fixture", "2091/older"]);
  assert.equal(entries[1].status, "archived");
  assert.deepEqual(await collectEditorFiles(path.join(root, "absent")), []);
});
