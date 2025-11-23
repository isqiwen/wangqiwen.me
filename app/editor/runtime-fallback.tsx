import type { ReactNode } from "react";

export default function RuntimeFallback({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <p className="font-semibold">Preview unavailable</p>
      <p className="mt-1">
        Install <code>@mdx-js/runtime@2</code> to enable live MDX preview, or copy the output and view it in the app.
      </p>
      <div className="mt-2 whitespace-pre-wrap break-words text-[11px] text-slate-700">{children}</div>
    </div>
  );
}
