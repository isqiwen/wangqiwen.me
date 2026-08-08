import { mdxMutedTextClass } from "./surface";

type ArchitectureNode = {
  id: string;
  label: string;
  group?: string;
  tone?: "default" | "accent" | "muted" | "success";
};

type ArchitectureEdge = {
  from: string;
  to: string;
  label?: string;
};

type ArchitectureDiagramProps = {
  title?: string;
  caption?: string;
  direction?: "LR" | "RL" | "TB" | "TD" | "BT";
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
};

const tones: Record<NonNullable<ArchitectureNode["tone"]>, string> = {
  default: "border-slate-400",
  accent: "border-sky-600",
  muted: "border-slate-300 dark:border-slate-600",
  success: "border-emerald-600",
};

export function ArchitectureDiagram({
  title,
  caption,
  direction = "LR",
  nodes,
  edges,
}: ArchitectureDiagramProps) {
  const orderedNodes = direction === "RL" || direction === "BT" ? [...nodes].reverse() : nodes;
  const horizontal = direction === "LR" || direction === "RL";

  return (
    <figure className="my-10">
      {title ? (
        <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
      ) : null}
      <div className="mt-5 border-y border-slate-200/80 py-6 dark:border-white/10">
        <ol
          className={
            horizontal
              ? "grid gap-y-7 md:grid-flow-col md:auto-cols-fr md:gap-x-7"
              : "grid gap-y-7"
          }
        >
          {orderedNodes.map((node, index) => {
            const outgoing = edges.find(edge => edge.from === node.id);
            const incoming = edges.find(edge => edge.to === node.id);
            const isLast = index === orderedNodes.length - 1;

            return (
              <li
                key={node.id}
                className={`relative border-l-2 pl-4 md:border-l-0 md:border-t-2 md:pl-0 md:pt-4 ${
                  tones[node.tone ?? "default"]
                }`}
              >
                {!isLast && horizontal ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-[-1.85rem] top-[-0.45rem] z-10 hidden items-center text-slate-400 dark:text-slate-500 md:flex"
                  >
                    <span className="h-px w-5 bg-current" />
                    <span className="ml-[-1px] text-xs leading-none">▶</span>
                  </span>
                ) : null}
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {String(index + 1).padStart(2, "0")}
                  {node.group ? ` · ${node.group}` : null}
                </p>
                <p className="mt-2 text-base font-semibold leading-6 text-slate-950 dark:text-white">
                  {node.label}
                </p>
                {incoming?.label ? (
                  <p className={`mt-2 text-sm ${mdxMutedTextClass}`}>
                    Receives {incoming.label}.
                  </p>
                ) : outgoing?.label ? (
                  <p className={`mt-2 text-sm ${mdxMutedTextClass}`}>
                    Produces {outgoing.label}.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
      {caption ? (
        <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption>
      ) : null}
    </figure>
  );
}
