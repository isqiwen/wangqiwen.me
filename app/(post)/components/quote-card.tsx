import type { ReactNode } from "react";
import { RawImage } from "./raw-image";

type QuoteCardProps = {
  quote: ReactNode;
  author: string;
  role?: string;
  avatar?: string;
  background?: string;
};

export function QuoteCard({ quote, author, role, avatar, background }: QuoteCardProps) {
  return (
    <div
      className="my-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] dark:border-white/10"
      style={
        background
          ? {
              backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.92), rgba(15,23,42,0.82)), url(${background})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="max-w-3xl">
        <div className="text-5xl leading-none text-white/25">&ldquo;</div>
        <div className="mt-3 text-lg leading-relaxed text-white sm:text-xl">{quote}</div>
        <div className="mt-5 flex items-center gap-3 text-sm text-white/80">
          {avatar ? (
            <RawImage src={avatar} alt={author} className="h-11 w-11 rounded-full border border-white/15 object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white">
              {author.slice(0, 1)}
            </div>
          )}
          <div>
            <div className="font-semibold text-white">{author}</div>
            {role ? <div className="text-xs text-white/65">{role}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
