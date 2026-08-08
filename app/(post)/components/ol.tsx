export function OL({ children }) {
  return (
    <ol className="my-5 list-decimal list-outside space-y-2 pl-7 marker:font-mono marker:text-sm marker:text-slate-500 dark:marker:text-slate-400">
      {children}
    </ol>
  );
}
