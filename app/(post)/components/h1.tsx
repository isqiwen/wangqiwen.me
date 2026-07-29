import type { ComponentPropsWithoutRef } from "react";
import { getHeadingData, withHeadingAnchor } from "./utils";

export function H1({
  children,
  className = "",
  id: explicitId,
  ...props
}: ComponentPropsWithoutRef<"h1">) {
  const {
    children: headingChildren,
    id,
    title,
  } = getHeadingData(children, explicitId);

  return (
    <h1
      {...props}
      id={id}
      data-heading-title={title}
      className={`mb-1 scroll-mt-6 text-2xl font-bold dark:text-gray-100 ${className}`.trim()}
    >
      {withHeadingAnchor(headingChildren, id)}
    </h1>
  );
}
