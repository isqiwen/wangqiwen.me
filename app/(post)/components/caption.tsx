import Balancer from "react-wrap-balancer";
import type { ReactNode } from "react";

type CaptionProps = {
  children: ReactNode;
  className?: string;
};

export function Caption({ children, className = "" }: CaptionProps) {
  return (
    <span
      className={`block w-full text-xs my-2 font-mono text-gray-500 text-center leading-normal ${className}`}
    >
      <Balancer>
        <span className="[&>a]:post-link">{children}</span>
      </Balancer>
    </span>
  );
}
