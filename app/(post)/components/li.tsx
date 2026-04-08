// We use the `[ul_&]` prefix to keep unordered-list bullets independent
// from ordered-list markers.
export function LI({ children }) {
  return (
    <li
      className={`
        my-2
        [ul_&]:relative
        [ul_&]:pl-5
        [ul_&]:before:absolute
        [ul_&]:before:left-0
        [ul_&]:before:top-[0.7em]
        [ul_&]:before:h-1.5
        [ul_&]:before:w-1.5
        [ul_&]:before:rounded-full
        [ul_&]:before:bg-slate-400
        [ul_&]:before:content-['']
      `}
    >
      {children}
    </li>
  );
}
