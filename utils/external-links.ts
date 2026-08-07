export type ExternalReferenceKind = "link" | "image" | "tweet";

export type ExternalReference = {
  kind: ExternalReferenceKind;
  value: string;
  line: number;
};

export function extractExternalReferences(source: string): ExternalReference[] {
  const references: ExternalReference[] = [];
  const seen = new Set<string>();

  const add = (kind: ExternalReferenceKind, value: string, index: number) => {
    const normalized = value.trim();
    if (!shouldCheck(kind, normalized)) return;

    const line = source.slice(0, index).split("\n").length;
    const key = `${kind}:${normalized}:${line}`;
    if (seen.has(key)) return;

    seen.add(key);
    references.push({ kind, value: normalized, line });
  };

  for (const match of source.matchAll(
    /(!?)\[[^\]]*\]\(\s*(https?:\/\/(?:[^\s()]|\([^)]*\))+)(?:\s+["'][^)]*["'])?\s*\)/g
  )) {
    add(match[1] === "!" ? "image" : "link", match[2], match.index ?? 0);
  }

  for (const match of source.matchAll(
    /<(?:[^>\s]+\s+)*?(href|src)\s*=\s*(["'])(.*?)\2[^>]*>/g
  )) {
    add(match[1] === "src" ? "image" : "link", match[3], match.index ?? 0);
  }

  for (const match of source.matchAll(/<(https?:\/\/[^>\s]+)>/g)) {
    add("link", match[1], match.index ?? 0);
  }

  for (const match of source.matchAll(
    /<Tweet\b[^>]*\bid\s*=\s*(["'])(\d+)\1[^>]*\/?\s*>/g
  )) {
    add("tweet", match[2], match.index ?? 0);
  }

  return references;
}

function shouldCheck(kind: ExternalReferenceKind, value: string): boolean {
  if (kind === "tweet") return /^\d+$/.test(value);
  if (/^https?:\/\//i.test(value)) return true;

  return kind === "image" && value.startsWith("/");
}
