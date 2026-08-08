import type { ComponentPropsWithoutRef } from "react";
import { getHeadingData, withHeadingAnchor } from "./utils";

export function H4({
  children,
  className = "",
  id: explicitId,
  ...props
}: ComponentPropsWithoutRef<"h4">) {
  const {
    children: headingChildren,
    id,
    title,
  } = getHeadingData(children, explicitId);

  return (
    <h4
      {...props}
      id={id}
      data-heading-title={title}
      className={`group relative my-6 scroll-mt-6 text-base font-semibold ${className}`.trim()}
    >
      {withHeadingAnchor(headingChildren, id)}
    </h4>
  );
}
