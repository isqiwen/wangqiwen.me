"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { componentsPalette, type ComponentSnippet } from "./snippets";

type Locale = "zh" | "en";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function EditorPage() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [title, setTitle] = useState("未命名文章");
  const [description, setDescription] = useState("给文章加一句描述");
  const [publishedAt, setPublishedAt] = useState(today());
  const [id, setId] = useState("my-post");
  const [body, setBody] = useState(`# ${title}\n\n在这里写正文内容。\n`);
  const [fileOptions, setFileOptions] = useState<Array<{ path: string; label: string }>>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [saveHint, setSaveHint] = useState("");
  const [loadHint, setLoadHint] = useState("");
  const [pickerMessage, setPickerMessage] = useState("");
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [cursorPos, setCursorPos] = useState<number>(body.length);

  async function publishPost() {
    try {
      const res = await fetch("/api/editor/publish", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      setSaveHint("已执行 pnpm sync:posts");
    } catch {
      setSaveHint("发布失败，请检查服务器日志");
    }
  }

  const mdxContent = useMemo(() => {
    return `export const metadata = {
  "title": "${escapeValue(title)}",
  "description": "${escapeValue(description)}",
  "publishedAt": "${publishedAt}",
  "id": "${id}"
};

${body.trim()}\n`;
  }, [title, description, publishedAt, id, body]);

  const targetPath = useMemo(() => {
    const year = publishedAt ? publishedAt.slice(0, 4) : "2025";
    return `app/(post)/${locale}/${year}/${id}/page.mdx`;
  }, [locale, publishedAt, id]);

  const saveToDisk = async () => {
    try {
      const res = await fetch("/api/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath, content: mdxContent }),
      });
      if (!res.ok) throw new Error("failed");
      setSaveHint(`已保存到 ${targetPath}`);
    } catch {
      setSaveHint("保存失败，请检查文件路径或权限");
    }
  };

  const loadFromPath = async (path: string) => {
    try {
      const res = await fetch(`/api/editor?path=${encodeURIComponent(path)}`);
      if (res.status === 404) {
        setPickerMessage("未找到目标文件");
        return;
      }
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      const content = typeof data.content === "string" ? data.content : "";
      if (!content) {
        setPickerMessage("文件为空");
        return;
      }
      applyContent(content);
      setSelectedPath(path);
      setShowPicker(false);
      setPickerMessage("");
      setLoadHint(`已加载：${path}`);
    } catch {
      setPickerMessage("读取文件失败，请重试");
      setLoadHint("读取文件失败，请重试");
    }
  };

  const refreshFileList = async () => {
    try {
      const res = await fetch("/api/editor/list");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { files?: Array<{ path: string; label: string }> };
      const files = data.files ?? [];
      setFileOptions(files);
      if (files.length > 0) {
        setSelectedPath(files[0].path);
      } else {
        setSelectedPath("");
      }
      setPickerMessage(files.length === 0 ? "暂无文件" : "");
    } catch {
      setPickerMessage("加载文件列表失败");
    }
  };

  useEffect(() => {
    if (showPicker) {
      refreshFileList();
    }
  }, [showPicker]);

  useEffect(() => {
    if (!saveHint) return;
    const timer = setTimeout(() => setSaveHint(""), 2000);
    return () => clearTimeout(timer);
  }, [saveHint]);

  useEffect(() => {
    if (!loadHint) return;
    const timer = setTimeout(() => setLoadHint(""), 2000);
    return () => clearTimeout(timer);
  }, [loadHint]);

  const applyContent = (content: string) => {
    const metadataMatch = content.match(/export const metadata =\s*\{([\s\S]*?)\};?/);
    if (metadataMatch) {
      try {
        // eslint-disable-next-line no-new-func
        const meta = new Function(`return ({${metadataMatch[1]}});`)() as Partial<{
          title: string;
          description: string;
          publishedAt: string;
          id: string;
        }>;
        if (meta.title) setTitle(meta.title);
        if (meta.description) setDescription(meta.description);
        if (meta.publishedAt) setPublishedAt(meta.publishedAt);
        if (meta.id) setId(meta.id);
      } catch {
        // ignore parse errors
      }
    }

    const bodyContent = content.replace(/export const metadata =[\s\S]*?;\s*/, "").trimStart();
    setBody(bodyContent || content);
    setCursorPos((bodyContent || content).length);
  };

  const insertSnippet = (snippet: string) => {
    const el = editorRef.current;
    const pos = el?.selectionStart ?? cursorPos ?? body.length;
    const before = body.slice(0, pos);
    const after = body.slice(pos);
    const needsPrefix = before.length > 0 && !before.endsWith("\n\n");
    const prefix = needsPrefix ? "\n\n" : "";
    const suffix = after.startsWith("\n") ? "" : "\n\n";
    const next = `${before}${prefix}${snippet}${suffix}${after}`;
    setBody(next);
    const nextPos = (before + prefix + snippet).length;
    setCursorPos(nextPos);
    // restore cursor
    requestAnimationFrame(() => {
      const textarea = editorRef.current;
      if (textarea) {
        textarea.selectionStart = textarea.selectionEnd = nextPos;
        textarea.focus();
      }
    });
  };

  return (
    <main
      className="flex w-screen max-w-none flex-col gap-6 px-4 py-8 lg:px-6"
      style={{ marginLeft: "calc(50% - 50vw)" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">MDX Editor</h1>
          <p className="text-sm text-slate-500">填写元数据与正文，可直接保存到磁盘或从文件选择器加载。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={publishPost}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
          >
            发布
          </button>
          <button
            onClick={saveToDisk}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
          >
            保存
          </button>
          <button
            onClick={() => setShowPicker(true)}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
          >
            加载
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Title">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="ID">
            <input
              value={id}
              onChange={e => setId(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Language">
            <select
              value={locale}
              onChange={e => setLocale(e.target.value as Locale)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="zh">zh</option>
              <option value="en">en</option>
            </select>
          </Field>
          <Field label="Published At (YYYY-MM-DD)">
            <input
              type="date"
              value={publishedAt}
              onChange={e => setPublishedAt(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Description" spanFull>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600">Body (MDX)</label>
          </div>
          <textarea
            ref={editorRef}
            value={body}
            onChange={e => {
              setBody(e.target.value);
              setCursorPos(e.target.selectionStart ?? e.target.value.length);
            }}
            onSelect={e => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPos(target.selectionStart ?? 0);
            }}
            className="min-h-[800px] w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm"
            spellCheck={false}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">组件列表</h2>
          <ComponentPalette onInsert={insertSnippet} />
        </div>
      </section>

      {(saveHint || loadHint) && (
        <div className="pointer-events-none fixed top-4 right-4 z-40 space-y-2">
          {saveHint && (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg">
              {saveHint}
            </div>
          )}
          {loadHint && (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg">
              {loadHint}
            </div>
          )}
        </div>
      )}

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[480px] max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">选择文件</h3>
                <p className="text-xs text-slate-500">限定在 app/(post)/zh 或 en 下的 page.mdx</p>
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                关闭
              </button>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
              {fileOptions.length === 0 ? (
                <div className="text-slate-400">暂无文件，请确认 app/(post)/zh|en 目录存在 page.mdx</div>
              ) : (
                <FolderTree tree={buildTree(fileOptions)} selectedPath={selectedPath} onSelect={loadFromPath} />
              )}
            </div>
            {pickerMessage && <div className="mt-2 text-[11px] text-rose-500">{pickerMessage}</div>}
            <div className="mt-3 text-right text-[11px] text-slate-500">路径被限制在 app/(post) 下</div>
          </div>
        </div>
      )}
    </main>
  );
}

function escapeValue(value: string) {
  return value.replace(/"/g, '\\"');
}

function Field({
  label,
  children,
  spanFull,
}: {
  label: string;
  children: React.ReactNode;
  spanFull?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 ${spanFull ? "md:col-span-2 lg:col-span-4" : ""}`}>
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function ComponentPalette({ onInsert }: { onInsert: (snippet: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-600">Insert component</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {componentsPalette.map((item: ComponentSnippet) => (
          <button
            key={item.label}
            onClick={() => onInsert(item.snippet)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50"
          >
            <div className="font-semibold">{item.label}</div>
            <div className="text-[11px] text-slate-500">{item.hint}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

type TreeNode = {
  name: string;
  path?: string;
  children?: TreeNode[];
};

function getOrCreate(nodes: TreeNode[], name: string): TreeNode {
  let node = nodes.find(n => n.name === name);
  if (!node) {
    node = { name, children: [] };
    nodes.push(node);
  }
  return node;
}

function buildTree(files: Array<{ path: string; label: string }>): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.label.split("/");
    // Expecting locale/year/slug/page.mdx
    if (parts.length < 4) continue;
    const [locale, year, slug] = parts;

    const localeNode = getOrCreate(root, locale);
    const yearNode = getOrCreate(localeNode.children!, year);
    const slugNode = getOrCreate(yearNode.children!, slug);
    slugNode.path = file.path;
  }

  return root;
}

function FolderTree({
  tree,
  selectedPath,
  onSelect,
}: {
  tree: TreeNode[];
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleLocale = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-1">
      {tree.map(localeNode => {
        const localeKey = localeNode.name;
        const isLocaleOpen = !!expanded[localeKey];
        return (
          <div key={localeKey} className="rounded-md border border-slate-200 bg-white p-2">
            <button
              type="button"
              onClick={() => toggleLocale(localeKey)}
              className="flex w-full items-center justify-between text-left font-semibold text-slate-700"
            >
              <span>{localeNode.name}</span>
              <span className="text-[11px] text-slate-500">{isLocaleOpen ? "收起" : "展开"}</span>
            </button>
            {isLocaleOpen && (
              <div className="mt-1 space-y-1 pl-2">
                {localeNode.children?.map(yearNode => (
                  <div key={`${localeKey}/${yearNode.name}`} className="rounded-md border border-slate-100 bg-white/60 p-1">
                    <div className="flex w-full items-center justify-between text-left text-slate-600">
                      <span>{yearNode.name}</span>
                    </div>
                    <div className="mt-1 grid grid-cols-1 gap-1 pl-2">
                      {yearNode.children?.map(slugNode => (
                        <button
                          key={slugNode.path}
                          onClick={() => slugNode.path && onSelect(slugNode.path)}
                          className={`rounded border px-2 py-1 text-left text-[12px] transition ${
                            slugNode.path === selectedPath
                              ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                        >
                          {slugNode.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
