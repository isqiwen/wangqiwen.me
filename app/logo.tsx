"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/locales/config";
import { getAuthorName } from "@/utils/site-config";

export function Logo({ language }: { language: Locale }) {
  const pathname = usePathname();
  const label = getAuthorName(language);
  const isChinese = /[\u3400-\u9FFF]/.test(label);
  const textClass = `text-md md:text-lg whitespace-nowrap font-bold ${isChinese ? "tracking-[0.2em]" : ""}`;

  return (
    <span className={textClass}>
      {pathname === "/" ? (
        <span className="cursor-default pr-2">{label}</span>
      ) : (
        <Link
          href="/"
          className="hover:bg-gray-200 dark:hover:bg-[#313131] active:bg-gray-300 dark:active:bg-[#242424] p-2 rounded-sm -ml-2 transition-[background-color]"
        >
          {label}
        </Link>
      )}
    </span>
  );
}
