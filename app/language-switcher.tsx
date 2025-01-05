"use client";

import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie'

interface LanguageSwitcherProps {
  currentLanguage: 'en' | 'zh';
}

export function LanguageSwitcher({ currentLanguage }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
    Cookies.set('language', newLanguage);

    if (pathname === '/') {
      router.refresh();
    } else if (pathname.startsWith('/about/zh') || pathname.startsWith('/about/en')) {
      const newPath = pathname.replace(/^\/about\/(zh|en)/, `/about/${newLanguage}`);
      router.push(newPath);
      router.refresh();
    } else if (pathname.startsWith('/zh') || pathname.startsWith('/en')) {
      const updatedPath = pathname.replace(/^\/(zh|en)/, `/${newLanguage}`);
      router.push(updatedPath);
      router.refresh();
    } else {
      router.refresh();
    }
  };

  return (
    <button
        onClick={toggleLanguage}
        className="inline-flex hover:bg-gray-200 dark:hover:bg-[#313131] active:bg-gray-300 dark:active:bg-[#242424] rounded-sm p-2 transition-[background-color]"
    >
        {currentLanguage === 'zh' ? '英语' : 'Chinese'}
    </button>
  );
}
