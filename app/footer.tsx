import { A } from "./(post)/components/a";

type FooterProps = {
  language: 'en' | 'zh';
};

export function Footer({ language }: FooterProps) {
  const useChinese = language === "zh";

  return (
    <footer className="p-6 pt-3 pb-6 flex text-xs text-center mt-3 dark:text-gray-400 text-gray-500 font-mono">
      <div className="grow text-left">
        { useChinese ? "王琦文" : "Wang QiWen"} (
        <A target="_blank" href="https://twitter.com/QiwenWang1">
          { useChinese ? "@王琦文" : "@Wang QiWen"}
        </A>
        )
      </div>
      <div>
        <A target="_blank" href="https://github.com/isqiwen/wangqiwen.xyz">
          { useChinese ? "源码" : "Source"}
        </A>
      </div>
    </footer>
  );
}
