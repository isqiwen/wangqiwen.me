export function UL({ children }) {
  return (
    <ul className="my-5 list-disc list-outside space-y-2 pl-7 marker:text-slate-400 dark:marker:text-slate-500">
      {children}
    </ul>
  );
}
