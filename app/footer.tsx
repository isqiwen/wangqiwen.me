import { A } from "./(post)/components/a";

export function Footer({ dict }: { dict: any }) {

  return (
    <footer className="p-6 pt-3 pb-6 flex text-xs text-center mt-3 dark:text-gray-400 text-gray-500 font-mono">
      <div className="grow text-left">
        { dict.wangqiwen } (
        <A target="_blank" href="https://twitter.com/QiwenWang1">
          { "@" + dict.wangqiwen }
        </A>
        )
      </div>
      <div>
        <A target="_blank" href="https://github.com/isqiwen/wangqiwen.xyz">
          { dict.source }
        </A>
      </div>
    </footer>
  );
}
