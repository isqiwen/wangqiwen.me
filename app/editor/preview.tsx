import "@mdx-js/react";
import { useMemo } from "react";
import { Snippet } from "@/app/(post)/components/snippet";
import RuntimeFallback from "./runtime-fallback";

// To avoid optional dependency resolution issues in dev/turbopack,
// we render a simplified preview that shows the generated MDX code.
export default function MdxLivePreview({ mdxSource }: { mdxSource: string }) {
  const content = useMemo(() => mdxSource, [mdxSource]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <RuntimeFallback>
        <Snippet scroll className="my-2">
          {content}
        </Snippet>
      </RuntimeFallback>
    </div>
  );
}
