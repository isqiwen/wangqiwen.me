"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { getAuthorName } from "@/utils/site-config";

export function Logo() {
  const pathname = usePathname();
  const label = getAuthorName();

  return (
    <span className="text-md whitespace-nowrap font-bold md:text-lg">
      {pathname === "/" ? (
        <span className="cursor-default pr-2">{label}</span>
      ) : (
        <Link
          href="/"
          className="-ml-2 rounded-sm p-2 transition-[background-color] hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-[#313131] dark:active:bg-[#242424]"
        >
          {label}
        </Link>
      )}
    </span>
  );
}
