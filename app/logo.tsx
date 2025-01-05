"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import useDictionary from "@/locales/dictionary-hook";

export function Logo() {
  const pathname = usePathname();
  const dict = useDictionary();

  return (
    <span className="text-md md:text-lg whitespace-nowrap font-bold">
      {pathname === "/" ? (
        <span className="cursor-default pr-2">{ dict.wangqiwen }</span>
      ) : (
        <Link
          href="/"
          className="hover:bg-gray-200 dark:hover:bg-[#313131] active:bg-gray-300 dark:active:bg-[#242424] p-2 rounded-sm -ml-2 transition-[background-color]"
        >
          { dict.wangqiwen }
        </Link>
      )}
    </span>
  );
}
