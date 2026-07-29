import type { ComponentPropsWithoutRef } from "react";
import { getHeadingData, withHeadingAnchor } from "./utils";

export function H2({
  children,
  className = "",
  id: explicitId,
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  const {
    children: headingChildren,
    id,
    title,
  } = getHeadingData(children, explicitId);

  return (
    <h2
      {...props}
      id={id}
      data-heading-title={title}
      className={`group relative my-8 scroll-mt-6 text-xl font-bold ${className}`.trim()}
    >
      {withHeadingAnchor(headingChildren, id)}
    </h2>
  );
}
