import { Highlight, themes } from "prism-react-renderer";
import type { Language } from "prism-react-renderer";
import type { RefObject } from "react";

export function MdxSyntaxHighlight({
  source,
  scrollRef,
}: {
  source: string;
  scrollRef: RefObject<HTMLPreElement | null>;
}) {
  return (
    <Highlight
      theme={themes.github}
      code={source}
      language={"markdown" as Language}
    >
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          ref={scrollRef}
          aria-hidden="true"
          data-testid="mdx-syntax-highlight"
          className="pointer-events-none col-start-1 row-start-1 m-0 min-h-[800px] overflow-hidden whitespace-pre-wrap break-words bg-transparent px-3 py-2 font-mono text-sm leading-6"
          style={{ ...style, backgroundColor: "transparent" }}
        >
          {tokens.map((line, lineIndex) => {
            const lineProps = getLineProps({ line });

            return (
              <div
                key={lineIndex}
                {...lineProps}
                className={`${lineProps.className ?? ""} min-h-6`}
              >
                {line.map((token, tokenIndex) => {
                  const tokenProps = getTokenProps({ token });
                  return <span key={tokenIndex} {...tokenProps} />;
                })}
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
