import type { MdxFormattingAction } from "./types";

export const MDX_FORMATTING_ACTIONS: Array<{
  action: MdxFormattingAction;
  label: string;
  shortcut?: string;
}> = [
  { action: "bold", label: "Bold", shortcut: "⌘/Ctrl+B" },
  { action: "link", label: "Link", shortcut: "⌘/Ctrl+K" },
  { action: "inlineCode", label: "Inline code" },
  { action: "codeBlock", label: "Code block" },
  { action: "quote", label: "Quote" },
  { action: "bulletList", label: "Bullet list" },
  { action: "orderedList", label: "Numbered list" },
  { action: "heading", label: "Heading 2" },
];

export function formatMdxSelection(
  source: string,
  selectionStart: number,
  selectionEnd: number,
  action: MdxFormattingAction
) {
  const start = Math.max(0, Math.min(selectionStart, source.length));
  const end = Math.max(start, Math.min(selectionEnd, source.length));
  const selected = source.slice(start, end);

  if (action === "bold") {
    const value = selected || "bold text";
    return replaceMdxRange(
      source,
      start,
      end,
      `**${value}**`,
      2,
      2 + value.length
    );
  }

  if (action === "link") {
    const label = selected || "link text";
    const href = "https://";
    return replaceMdxRange(
      source,
      start,
      end,
      `[${label}](${href})`,
      label.length + 3,
      label.length + 3 + href.length
    );
  }

  if (action === "inlineCode") {
    const value = selected || "code";
    return replaceMdxRange(
      source,
      start,
      end,
      `\`${value}\``,
      1,
      1 + value.length
    );
  }

  if (action === "codeBlock") {
    const value = selected || "code";
    return replaceMdxRange(
      source,
      start,
      end,
      `\`\`\`\n${value}\n\`\`\``,
      4,
      4 + value.length
    );
  }

  if (action === "heading") {
    const lineStart = source.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextLineBreak = source.indexOf("\n", end);
    const lineEnd = nextLineBreak === -1 ? source.length : nextLineBreak;
    const rangeStart = selected ? start : lineStart;
    const rangeEnd = selected ? end : lineEnd;
    const value =
      (selected || source.slice(lineStart, lineEnd))
        .replace(/^\s*#{1,6}\s+/, "")
        .trim() || "Section title";

    return replaceMdxRange(
      source,
      rangeStart,
      rangeEnd,
      `## ${value}`,
      3,
      3 + value.length
    );
  }

  const value = selected || (action === "quote" ? "Quote" : "List item");
  const prefix =
    action === "quote" ? "> " : action === "bulletList" ? "- " : "1. ";
  const formatted = value
    .split("\n")
    .map(line => `${prefix}${line}`)
    .join("\n");

  return replaceMdxRange(
    source,
    start,
    end,
    formatted,
    prefix.length,
    formatted.length
  );
}

function replaceMdxRange(
  source: string,
  start: number,
  end: number,
  replacement: string,
  selectionStartOffset: number,
  selectionEndOffset: number
) {
  return {
    source: `${source.slice(0, start)}${replacement}${source.slice(end)}`,
    selectionStart: start + selectionStartOffset,
    selectionEnd: start + selectionEndOffset,
  };
}

export function buildImageSnippet({
  src,
  width,
  height,
  alt,
}: {
  src: string;
  width?: number | null;
  height?: number | null;
  alt?: string;
}) {
  const lines = ["<Image", `  src="${src}"`];

  if (width && width > 0) {
    lines.push(`  width={${width}}`);
  }

  if (height && height > 0) {
    lines.push(`  height={${height}}`);
  }

  lines.push(`  alt="${escapeValue(alt ?? "")}"`);
  lines.push("/>");

  return lines.join("\n");
}

function escapeValue(value: string) {
  return value.replace(/"/g, '\\"');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function removeAssetReferencesFromBody(
  source: string,
  assetPath: string
) {
  const escapedPath = escapeRegExp(assetPath);
  const patterns = [
    new RegExp(
      String.raw`(?:\n{0,2})<Image\b[\s\S]*?src=(["'])${escapedPath}\1[\s\S]*?\/>(?:\n{0,2})`,
      "g"
    ),
    new RegExp(
      String.raw`!\[[^\]]*]\(${escapedPath.replace(
        /\//g,
        "\\/"
      )}(?:\s+["'][^"']*["'])?\)`,
      "g"
    ),
    new RegExp(String.raw`<img\b[^>]*src=(["'])${escapedPath}\1[^>]*\/?>`, "g"),
  ];

  let nextBody = source;
  let removed = 0;

  for (const pattern of patterns) {
    nextBody = nextBody.replace(pattern, match => {
      removed += 1;
      return match.startsWith("\n") ? "\n" : "";
    });
  }

  if (removed > 0) {
    nextBody = nextBody.replace(/\n{3,}/g, "\n\n");
  }

  return {
    body: nextBody,
    removed,
  };
}

export function stripExtension(name: string) {
  return name.replace(/\.[^.]+$/, "");
}
