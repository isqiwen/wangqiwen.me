export function Figure({ id = undefined, wide = false, children }) {
  return (
    <figure
      id={id}
      data-reference-kind={id ? "figure" : undefined}
      className={`my-10 scroll-mt-24 ${wide ? "xl:mx-[-3rem]" : ""}`}
    >
      {children}
    </figure>
  );
}
