import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type AnchorProps = ComponentPropsWithoutRef<"a"> & {
  href: string;
};

const linkClassName =
  "border-b border-gray-300 text-gray-600 transition-[border-color] hover:border-gray-600 dark:border-gray-500 dark:text-white dark:hover:border-white";

function isExternalHttpLink(href: string) {
  return /^https?:\/\//i.test(href);
}

function withSecurityRel(rel?: string) {
  return Array.from(
    new Set([...(rel?.split(/\s+/).filter(Boolean) ?? []), "noopener", "noreferrer"])
  ).join(" ");
}

export function A({
  children,
  className = "",
  href,
  rel,
  target,
  ...props
}: AnchorProps) {
  const classes = `${linkClassName} ${className}`.trim();

  if (isExternalHttpLink(href)) {
    const externalTarget = target ?? "_blank";

    return (
      <a
        href={href}
        className={classes}
        target={externalTarget}
        rel={withSecurityRel(rel)}
        {...props}
      >
        {children}
        {externalTarget === "_blank" ? (
          <span className="sr-only"> (opens in a new tab)</span>
        ) : null}
      </a>
    );
  }

  if (href.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(href)) {
    return (
      <a href={href} className={classes} rel={rel} target={target} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} rel={rel} target={target} {...props}>
      {children}
    </Link>
  );
}
