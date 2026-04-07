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
      className="my-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)]"
      style={
        background
          ? {
              backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.8)), url(${background})`,
              backgroundSize: "cover",
            }
          : undefined
      }
    >
      <div className="text-5xl leading-none text-white/40">&ldquo;</div>
      <div className="mt-2 text-lg leading-relaxed text-white">{quote}</div>
      <div className="mt-4 flex items-center gap-3 text-sm text-white/80">
        {avatar ? <RawImage src={avatar} alt={author} className="h-10 w-10 rounded-full object-cover" /> : null}
        <div>
          <div className="font-semibold text-white">{author}</div>
          {role ? <div className="text-xs text-white/70">{role}</div> : null}
        </div>
      </div>
    </div>
  );
}
