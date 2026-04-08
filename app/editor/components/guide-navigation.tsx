"use client";

import { useEffect, useMemo, useState } from "react";

export type GuideNavigationSection = {
  id: string;
  title: string;
  count: number;
  items: Array<{
    id: string;
    label: string;
  }>;
};

export function GuideNavigation({ sections }: { sections: GuideNavigationSection[] }) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(sections[0]?.id ?? null);
  const [activeItemId, setActiveItemId] = useState<string | null>(sections[0]?.items[0]?.id ?? null);
  const flatItemIds = useMemo(
    () => sections.flatMap(section => section.items.map(item => item.id)),
    [sections],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateActiveIds = () => {
      const categoryOffset = 160;
      const itemOffset = 200;

      let nextCategoryId = sections[0]?.id ?? null;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= categoryOffset) {
          nextCategoryId = section.id;
        }
      }

      if (!nextCategoryId) {
        nextCategoryId = sections[0]?.id ?? null;
      }

      let nextItemId = flatItemIds[0] ?? null;
      for (const itemId of flatItemIds) {
        const element = document.getElementById(itemId);
        if (element && element.getBoundingClientRect().top <= itemOffset) {
          nextItemId = itemId;
        }
      }

      if (!nextItemId) {
        nextItemId = flatItemIds[0] ?? null;
      }

      setActiveCategoryId(nextCategoryId);
      setActiveItemId(nextItemId);
    };

    updateActiveIds();
    window.addEventListener("scroll", updateActiveIds, { passive: true });
    window.addEventListener("resize", updateActiveIds);
    window.addEventListener("hashchange", updateActiveIds);

    return () => {
      window.removeEventListener("scroll", updateActiveIds);
      window.removeEventListener("resize", updateActiveIds);
      window.removeEventListener("hashchange", updateActiveIds);
    };
  }, [flatItemIds, sections]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const targetId = activeItemId ?? activeCategoryId;
    if (!targetId) {
      return;
    }

    const nextHash = `#${targetId}`;
    if (window.location.hash === nextHash) {
      return;
    }

    window.history.replaceState(null, "", nextHash);
  }, [activeCategoryId, activeItemId]);

  return (
    <nav className="mt-8 space-y-5 border-t border-slate-200 pt-6">
      {sections.map(section => {
        const isCategoryActive = section.id === activeCategoryId;

        return (
          <div key={section.id} className="space-y-2">
            <a
              href={`#${section.id}`}
              className={`flex items-center justify-between rounded-2xl px-3 py-2 transition ${
                isCategoryActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "hover:bg-white/80"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`h-5 w-1 rounded-full transition-all ${
                    isCategoryActive ? "bg-white" : "bg-slate-200"
                  }`}
                />
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.26em] ${
                    isCategoryActive ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  {section.title}
                </span>
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-sm ${
                  isCategoryActive
                    ? "bg-white/15 text-white"
                    : "bg-white text-slate-500"
                }`}
              >
                {section.count}
              </span>
            </a>

            <div className="space-y-1 pl-3">
              {section.items.map(item => {
                const isActive = item.id === activeItemId;

                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block rounded-xl px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    aria-current={isActive ? "location" : undefined}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition-all ${
                          isActive ? "bg-slate-900" : "bg-slate-200"
                        }`}
                      />
                      <span>{item.label}</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
