"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

type LogoProps = {
  language: 'en' | 'zh';
};

export function Logo({ language }: LogoProps) {
  const pathname = usePathname();
  const useChinese = language === "zh";

  return (
    <span className="text-md md:text-lg whitespace-nowrap font-bold">
      {pathname === "/" ? (
        <span className="cursor-default pr-2">{useChinese ? "王 琦文" : "Wang QiWen"}</span>
      ) : (
        <Link
          href="/"
          className="hover:bg-gray-200 dark:hover:bg-[#313131] active:bg-gray-300 dark:active:bg-[#242424] p-2 rounded-sm -ml-2 transition-[background-color]"
        >
          {useChinese ? "王 琦文" : "Wang QiWen"}
        </Link>
      )}
    </span>
  );
}
