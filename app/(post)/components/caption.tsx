import type { ReactNode } from "react";

type CaptionProps = {
  children: ReactNode;
  className?: string;
};

export function Caption({ children, className = "" }: CaptionProps) {
  return (
    <span
      className={`block w-full text-balance text-xs my-2 font-mono text-gray-500 text-center leading-normal ${className}`}
    >
      <span className="[&>a]:post-link">{children}</span>
    </span>
  );
}
