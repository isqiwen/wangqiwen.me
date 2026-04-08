import { MermaidDiagram } from "./mermaid-diagram";

type ArchitectureNode = {
  id: string;
  label: string;
  group?: string;
  shape?:
    | "rect"
    | "rounded"
    | "stadium"
    | "subroutine"
    | "cylinder"
    | "diamond"
    | "circle";
  tone?: "default" | "accent" | "muted" | "success";
};

type ArchitectureEdge = {
  from: string;
  to: string;
  label?: string;
  style?: "solid" | "dashed" | "thick";
};

type ArchitectureDiagramProps = {
  title?: string;
  caption?: string;
  direction?: "LR" | "RL" | "TB" | "TD" | "BT";
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
};

const shapeByKind: Record<NonNullable<ArchitectureNode["shape"]>, [string, string]> = {
  rect: ["[\"", "\"]"],
  rounded: ["(\"", "\")"],
  stadium: ["([\"", "\"])"],
  subroutine: ["[[\"", "\"]]"],
  cylinder: ["[(\"", "\")]"],
  diamond: ["{\"", "\"}"],
  circle: ["((\"", "\"))"],
};

const classByTone: Record<NonNullable<ArchitectureNode["tone"]>, string> = {
  default: "node-default",
  accent: "node-accent",
  muted: "node-muted",
  success: "node-success",
};

export function ArchitectureDiagram({
  title,
  caption,
  direction = "LR",
  nodes,
  edges,
}: ArchitectureDiagramProps) {
  const chart = buildArchitectureChart(direction, nodes, edges);

  return <MermaidDiagram chart={chart} title={title} caption={caption} />;
}

function buildArchitectureChart(
  direction: ArchitectureDiagramProps["direction"],
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
) {
  const lines = [`flowchart ${direction}`];
  const groups = new Map<string, ArchitectureNode[]>();
  const ungrouped: ArchitectureNode[] = [];
  const classEntries: Array<{ id: string; className: string }> = [];

  for (const node of nodes) {
    const tone = classByTone[node.tone ?? "default"];
    classEntries.push({ id: node.id, className: tone });

    if (node.group) {
      const list = groups.get(node.group) ?? [];
      list.push(node);
      groups.set(node.group, list);
      continue;
    }

    ungrouped.push(node);
  }

  for (const node of ungrouped) {
    lines.push(`  ${formatNode(node)}`);
  }

  for (const [group, groupNodes] of groups) {
    lines.push(`  subgraph ${escapeLabel(group)}`);
    for (const node of groupNodes) {
      lines.push(`    ${formatNode(node)}`);
    }
    lines.push("  end");
  }

  for (const edge of edges) {
    lines.push(`  ${formatEdge(edge)}`);
  }

  lines.push(
    "  classDef node-default fill:#f8fafc,stroke:#cbd5e1,color:#0f172a,stroke-width:1.2px",
  );
  lines.push(
    "  classDef node-accent fill:#dbeafe,stroke:#2563eb,color:#0f172a,stroke-width:1.4px",
  );
  lines.push(
    "  classDef node-muted fill:#f1f5f9,stroke:#94a3b8,color:#334155,stroke-width:1.1px",
  );
  lines.push(
    "  classDef node-success fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:1.4px",
  );

  for (const entry of classEntries) {
    lines.push(`  class ${entry.id} ${entry.className}`);
  }

  return lines.join("\n");
}

function formatNode(node: ArchitectureNode) {
  const [open, close] = shapeByKind[node.shape ?? "rounded"];
  return `${node.id}${open}${escapeLabel(node.label)}${close}`;
}

function formatEdge(edge: ArchitectureEdge) {
  const connector =
    edge.style === "dashed" ? "-.->" : edge.style === "thick" ? "==>" : "-->";

  if (edge.label) {
    return `${edge.from} ${connector}|${escapeLabel(edge.label)}| ${edge.to}`;
  }

  return `${edge.from} ${connector} ${edge.to}`;
}

function escapeLabel(value: string) {
  return value.replace(/"/g, "&quot;");
}
