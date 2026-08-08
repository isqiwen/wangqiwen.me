export type DiffContentRow = {
  kind: "context" | "removed" | "added";
  beforeLine: number | null;
  afterLine: number | null;
  content: string;
};

export type DiffRow =
  | DiffContentRow
  | {
      kind: "collapsed";
      count: number;
    };

export type SplitDiffRow =
  | {
      kind: "split";
      before: DiffContentRow | null;
      after: DiffContentRow | null;
    }
  | {
      kind: "collapsed";
      count: number;
    };

type ExpandedDiffRow = DiffContentRow;

export function buildDiffRows(before: string, after: string, contextLines = 3): DiffRow[] {
  const rows = buildExpandedRows(toLines(before), toLines(after));
  const changedIndexes = rows.flatMap((row, index) => (row.kind === "context" ? [] : [index]));

  if (changedIndexes.length === 0) {
    return rows;
  }

  const visible = new Set<number>();
  const radius = Math.max(0, Math.floor(contextLines));

  for (const index of changedIndexes) {
    for (let candidate = Math.max(0, index - radius); candidate <= Math.min(rows.length - 1, index + radius); candidate += 1) {
      visible.add(candidate);
    }
  }

  const output: DiffRow[] = [];
  let hiddenCount = 0;

  for (let index = 0; index < rows.length; index += 1) {
    if (!visible.has(index)) {
      hiddenCount += 1;
      continue;
    }

    if (hiddenCount > 0) {
      output.push({ kind: "collapsed", count: hiddenCount });
      hiddenCount = 0;
    }

    output.push(rows[index]);
  }

  if (hiddenCount > 0) {
    output.push({ kind: "collapsed", count: hiddenCount });
  }

  return output;
}

export function buildSplitDiffRows(before: string, after: string, contextLines = 3): SplitDiffRow[] {
  const rows = buildDiffRows(before, after, contextLines);
  const output: SplitDiffRow[] = [];
  let index = 0;

  while (index < rows.length) {
    const row = rows[index];

    if (row.kind === "collapsed") {
      output.push(row);
      index += 1;
      continue;
    }

    if (row.kind === "context") {
      output.push({ kind: "split", before: row, after: row });
      index += 1;
      continue;
    }

    const removed: DiffContentRow[] = [];
    const added: DiffContentRow[] = [];

    while (index < rows.length) {
      const change = rows[index];
      if (change.kind === "collapsed" || change.kind === "context") break;
      if (change.kind === "removed") removed.push(change);
      if (change.kind === "added") added.push(change);
      index += 1;
    }

    const count = Math.max(removed.length, added.length);
    for (let offset = 0; offset < count; offset += 1) {
      output.push({
        kind: "split",
        before: removed[offset] ?? null,
        after: added[offset] ?? null,
      });
    }
  }

  return output;
}

function buildExpandedRows(before: string[], after: string[]): ExpandedDiffRow[] {
  const lengths = Array.from({ length: before.length + 1 }, () => new Uint32Array(after.length + 1));

  for (let beforeIndex = before.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    for (let afterIndex = after.length - 1; afterIndex >= 0; afterIndex -= 1) {
      lengths[beforeIndex][afterIndex] =
        before[beforeIndex] === after[afterIndex]
          ? lengths[beforeIndex + 1][afterIndex + 1] + 1
          : Math.max(lengths[beforeIndex + 1][afterIndex], lengths[beforeIndex][afterIndex + 1]);
    }
  }

  const rows: ExpandedDiffRow[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;

  while (beforeIndex < before.length || afterIndex < after.length) {
    if (before[beforeIndex] === after[afterIndex]) {
      rows.push({
        kind: "context",
        beforeLine: beforeIndex + 1,
        afterLine: afterIndex + 1,
        content: before[beforeIndex],
      });
      beforeIndex += 1;
      afterIndex += 1;
      continue;
    }

    const removeBefore =
      beforeIndex < before.length &&
      (afterIndex === after.length || lengths[beforeIndex + 1][afterIndex] >= lengths[beforeIndex][afterIndex + 1]);

    if (removeBefore) {
      rows.push({
        kind: "removed",
        beforeLine: beforeIndex + 1,
        afterLine: null,
        content: before[beforeIndex],
      });
      beforeIndex += 1;
      continue;
    }

    rows.push({
      kind: "added",
      beforeLine: null,
      afterLine: afterIndex + 1,
      content: after[afterIndex],
    });
    afterIndex += 1;
  }

  return rows;
}

function toLines(source: string): string[] {
  const normalized = source.replace(/\r\n?/g, "\n");
  if (!normalized) return [];
  return normalized.endsWith("\n") ? normalized.slice(0, -1).split("\n") : normalized.split("\n");
}
