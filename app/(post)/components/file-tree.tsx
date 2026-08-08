import type { ReactElement } from "react";

type FileTreeProps = {
  rootLabel?: string;
  paths: string[];
};

type FileTreeNode = {
  name: string;
  path: string;
  children: Map<string, FileTreeNode>;
};

const fileColorByExtension: Record<string, string> = {
  // Application code
  ts: "text-blue-700 dark:text-blue-400",
  tsx: "text-blue-700 dark:text-blue-400",
  js: "text-amber-600 dark:text-amber-300",
  jsx: "text-amber-600 dark:text-amber-300",
  mjs: "text-amber-600 dark:text-amber-300",
  cjs: "text-amber-600 dark:text-amber-300",
  py: "text-cyan-700 dark:text-cyan-300",
  pyw: "text-cyan-700 dark:text-cyan-300",
  rs: "text-orange-700 dark:text-orange-300",
  go: "text-sky-700 dark:text-sky-300",
  rb: "text-red-700 dark:text-red-300",
  java: "text-red-700 dark:text-red-300",
  kt: "text-violet-700 dark:text-violet-300",
  kts: "text-violet-700 dark:text-violet-300",
  swift: "text-orange-700 dark:text-orange-300",
  php: "text-indigo-700 dark:text-indigo-300",
  r: "text-sky-700 dark:text-sky-300",
  lua: "text-sky-700 dark:text-sky-300",
  scala: "text-red-700 dark:text-red-300",
  dart: "text-cyan-700 dark:text-cyan-300",
  c: "text-indigo-700 dark:text-indigo-300",
  cc: "text-indigo-700 dark:text-indigo-300",
  cp: "text-indigo-700 dark:text-indigo-300",
  cpp: "text-indigo-700 dark:text-indigo-300",
  cxx: "text-indigo-700 dark:text-indigo-300",
  h: "text-indigo-700 dark:text-indigo-300",
  hh: "text-indigo-700 dark:text-indigo-300",
  hpp: "text-indigo-700 dark:text-indigo-300",
  hxx: "text-indigo-700 dark:text-indigo-300",
  cs: "text-violet-700 dark:text-violet-300",
  sh: "text-lime-700 dark:text-lime-300",
  bash: "text-lime-700 dark:text-lime-300",
  zsh: "text-lime-700 dark:text-lime-300",
  fish: "text-lime-700 dark:text-lime-300",
  ps1: "text-blue-700 dark:text-blue-300",
  sql: "text-fuchsia-700 dark:text-fuchsia-300",

  // Web presentation
  css: "text-violet-700 dark:text-violet-300",
  scss: "text-pink-700 dark:text-pink-300",
  sass: "text-pink-700 dark:text-pink-300",
  less: "text-blue-700 dark:text-blue-300",
  html: "text-orange-700 dark:text-orange-300",
  htm: "text-orange-700 dark:text-orange-300",
  vue: "text-emerald-700 dark:text-emerald-300",
  svelte: "text-orange-700 dark:text-orange-300",
  svg: "text-pink-700 dark:text-pink-300",

  // Configuration and documentation
  json: "text-amber-700 dark:text-amber-300",
  jsonc: "text-amber-700 dark:text-amber-300",
  json5: "text-amber-700 dark:text-amber-300",
  yaml: "text-rose-700 dark:text-rose-300",
  yml: "text-rose-700 dark:text-rose-300",
  toml: "text-rose-700 dark:text-rose-300",
  ini: "text-rose-700 dark:text-rose-300",
  conf: "text-rose-700 dark:text-rose-300",
  config: "text-rose-700 dark:text-rose-300",
  env: "text-rose-700 dark:text-rose-300",
  cmake: "text-amber-700 dark:text-amber-300",
  xml: "text-orange-700 dark:text-orange-300",
  lock: "text-slate-600 dark:text-slate-300",
  md: "text-violet-700 dark:text-violet-300",
  mdx: "text-violet-700 dark:text-violet-300",
  rst: "text-violet-700 dark:text-violet-300",
  txt: "text-slate-600 dark:text-slate-300",
  tex: "text-sky-700 dark:text-sky-300",
  bib: "text-sky-700 dark:text-sky-300",
  pdf: "text-red-700 dark:text-red-300",

  // Research assets
  csv: "text-teal-700 dark:text-teal-300",
  tsv: "text-teal-700 dark:text-teal-300",
  parquet: "text-teal-700 dark:text-teal-300",
  npy: "text-teal-700 dark:text-teal-300",
  npz: "text-teal-700 dark:text-teal-300",
  h5: "text-teal-700 dark:text-teal-300",
  hdf5: "text-teal-700 dark:text-teal-300",
  nii: "text-teal-700 dark:text-teal-300",
  mat: "text-teal-700 dark:text-teal-300",
  dcm: "text-teal-700 dark:text-teal-300",
  dicom: "text-teal-700 dark:text-teal-300",
  gz: "text-teal-700 dark:text-teal-300",
  png: "text-pink-700 dark:text-pink-300",
  jpg: "text-pink-700 dark:text-pink-300",
  jpeg: "text-pink-700 dark:text-pink-300",
  gif: "text-pink-700 dark:text-pink-300",
  webp: "text-pink-700 dark:text-pink-300",
  avif: "text-pink-700 dark:text-pink-300",
  mp3: "text-fuchsia-700 dark:text-fuchsia-300",
  wav: "text-fuchsia-700 dark:text-fuchsia-300",
  mp4: "text-fuchsia-700 dark:text-fuchsia-300",
  mov: "text-fuchsia-700 dark:text-fuchsia-300",
};

const fileColorByName: Record<string, string> = {
  ".env": "text-rose-700 dark:text-rose-300",
  ".gitignore": "text-slate-600 dark:text-slate-300",
  ".gitattributes": "text-slate-600 dark:text-slate-300",
  ".npmrc": "text-red-700 dark:text-red-300",
  ".nvmrc": "text-emerald-700 dark:text-emerald-300",
  ".prettierrc": "text-pink-700 dark:text-pink-300",
  ".eslintrc": "text-violet-700 dark:text-violet-300",
  ".cmakelists": "text-amber-700 dark:text-amber-300",
  "cmakelists": "text-amber-700 dark:text-amber-300",
  "cmakelists.txt": "text-amber-700 dark:text-amber-300",
  dockerfile: "text-blue-700 dark:text-blue-300",
  makefile: "text-amber-700 dark:text-amber-300",
  justfile: "text-orange-700 dark:text-orange-300",
  gemfile: "text-red-700 dark:text-red-300",
  rakefile: "text-red-700 dark:text-red-300",
  procfile: "text-violet-700 dark:text-violet-300",
  readme: "text-violet-700 dark:text-violet-300",
  license: "text-violet-700 dark:text-violet-300",
  copying: "text-violet-700 dark:text-violet-300",
};

const fallbackFileColors = [
  "text-slate-700 dark:text-slate-200",
  "text-blue-700 dark:text-blue-300",
  "text-violet-700 dark:text-violet-300",
  "text-teal-700 dark:text-teal-300",
  "text-orange-700 dark:text-orange-300",
];

export function FileTree({
  rootLabel = "workspace",
  paths,
}: FileTreeProps) {
  const tree = buildTree(paths);

  return (
    <div className="my-5 w-fit max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="min-w-[22rem] font-mono text-sm leading-7 text-slate-700 dark:text-slate-200">
        <p className="mb-0.5 font-semibold text-sky-700 dark:text-sky-400">
          {rootLabel}/
        </p>
        <ul
          aria-label={`${rootLabel} file tree`}
          className="border-l border-slate-300/90 pl-4 dark:border-slate-600"
        >
          {Array.from(tree.children.values()).map(node =>
            renderNode(node),
          )}
        </ul>
      </div>
    </div>
  );
}

function buildTree(paths: string[]) {
  const root: FileTreeNode = {
    name: "",
    path: "",
    children: new Map(),
  };

  for (const rawPath of paths) {
    const cleaned = rawPath.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    if (!cleaned) {
      continue;
    }

    const segments = cleaned.split("/");
    let current = root;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const currentPath = segments.slice(0, index + 1).join("/");
      const existing = current.children.get(segment);

      if (existing) {
        current = existing;
        continue;
      }

      const next: FileTreeNode = {
        name: segment,
        path: currentPath,
        children: new Map(),
      };

      current.children.set(segment, next);
      current = next;
    }
  }

  return sortNode(root);
}

function sortNode(node: FileTreeNode): FileTreeNode {
  const sortedEntries = Array.from(node.children.entries()).sort((left, right) => {
    const leftIsFolder = left[1].children.size > 0;
    const rightIsFolder = right[1].children.size > 0;

    if (leftIsFolder !== rightIsFolder) {
      return leftIsFolder ? -1 : 1;
    }

    return left[0].localeCompare(right[0]);
  });

  node.children = new Map(sortedEntries.map(([name, child]) => [name, sortNode(child)]));
  return node;
}

function renderNode(node: FileTreeNode): ReactElement {
  const isFolder = node.children.size > 0;
  const nameClass = isFolder
    ? "font-medium text-sky-700 dark:text-sky-400"
    : getFileColorClass(node.name);

  return (
    <li key={node.path}>
      <div className="relative flex w-fit items-center px-1.5 py-px">
        <span
          aria-hidden="true"
          className="absolute -left-4 top-1/2 h-px w-3 bg-slate-300 dark:bg-slate-600"
        />
        <span className={nameClass}>{isFolder ? `${node.name}/` : node.name}</span>
      </div>

      {node.children.size ? (
        <ul
          className="ml-1.5 border-l border-slate-300/90 pl-4 dark:border-slate-600"
        >
          {Array.from(node.children.values()).map(child =>
            renderNode(child),
          )}
        </ul>
      ) : null}
    </li>
  );
}

function getFileColorClass(filename: string) {
  const normalizedName = filename.toLowerCase();
  const namedColor = fileColorByName[normalizedName];

  if (namedColor) {
    return namedColor;
  }

  const extension = normalizedName.split(".").at(-1);

  if (extension && fileColorByExtension[extension]) {
    return fileColorByExtension[extension];
  }

  return fallbackFileColors[stableColorIndex(extension || normalizedName)];
}

function stableColorIndex(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % fallbackFileColors.length;
}
