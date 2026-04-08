import {
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type TerminalLine = {
  text: string;
  tone?: "default" | "success" | "warning" | "error" | "info" | "muted";
  prompt?: string | boolean;
};

type TerminalBlockProps = {
  title?: string;
  caption?: string;
  lines: Array<string | TerminalLine>;
};

const toneClassName: Record<NonNullable<TerminalLine["tone"]>, string> = {
  default: "text-slate-100",
  success: "text-emerald-300",
  warning: "text-amber-300",
  error: "text-rose-300",
  info: "text-sky-300",
  muted: "text-slate-400",
};

export function TerminalBlock({ title, caption, lines }: TerminalBlockProps) {
  return (
    <section className={mdxPanelClass}>
      {(title || caption) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>Terminal Session</p> : null}
          {title ? (
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
          ) : null}
          {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-900/80 bg-slate-950 text-sm shadow-[0_24px_80px_rgba(2,6,23,0.28)]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 font-mono text-xs uppercase tracking-[0.26em] text-slate-500">
            session.log
          </span>
        </div>
        <div className="space-y-2 px-4 py-4 font-mono leading-7">
          {lines.map((line, index) => {
            const normalized = normalizeLine(line);
            const prompt = normalized.prompt;

            return (
              <div key={`${normalized.text}-${index}`} className="flex gap-3">
                {prompt ? (
                  <span className="select-none text-emerald-300">{prompt}</span>
                ) : (
                  <span className="w-3 shrink-0" />
                )}
                <span className={`whitespace-pre-wrap break-words ${toneClassName[normalized.tone]}`}>
                  {normalized.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function normalizeLine(line: string | TerminalLine): Required<TerminalLine> {
  if (typeof line !== "string") {
    return {
      text: line.text,
      tone: line.tone ?? "default",
      prompt:
        line.prompt === true ? "$" : typeof line.prompt === "string" ? line.prompt : "",
    };
  }

  if (line.startsWith("$ ")) {
    return { text: line.slice(2), tone: "default", prompt: "$" };
  }

  if (line.startsWith("> ")) {
    return { text: line.slice(2), tone: "info", prompt: ">" };
  }

  if (line.startsWith("[success] ")) {
    return { text: line.slice(10), tone: "success", prompt: "" };
  }

  if (line.startsWith("[warn] ")) {
    return { text: line.slice(7), tone: "warning", prompt: "" };
  }

  if (line.startsWith("[error] ")) {
    return { text: line.slice(8), tone: "error", prompt: "" };
  }

  if (line.startsWith("[info] ")) {
    return { text: line.slice(7), tone: "info", prompt: "" };
  }

  return { text: line, tone: "muted", prompt: "" };
}
