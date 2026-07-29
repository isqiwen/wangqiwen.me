import type { ComponentPropsWithoutRef } from "react";
import { getHeadingData, withHeadingAnchor } from "./utils";

export function H3({
  children,
  className = "",
  id: explicitId,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  const {
    children: headingChildren,
    id,
    title,
  } = getHeadingData(children, explicitId);

  return (
    <h3
      {...props}
      id={id}
      data-heading-title={title}
      className={`group relative my-8 scroll-mt-6 text-lg font-bold ${className}`.trim()}
    >
      {withHeadingAnchor(headingChildren, id)}
    </h3>
  );
}
