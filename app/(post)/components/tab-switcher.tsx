"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { Caption } from "./caption";
import { mdxPanelClass, mdxPillButtonClass } from "./surface";

export type TabPanel = {
  title: string;
  content: ReactNode;
  // A code panel shows the caption itself.
  isSnippet: boolean;
};

// Only the choice of tab lives in the browser. The panels arrive rendered.
export function TabSwitcher({
  panels,
  defaultIndex,
  caption,
  emptyState,
}: {
  panels: TabPanel[];
  defaultIndex: number;
  caption?: ReactNode;
  emptyState: ReactNode;
}) {
  const [active, setActive] = useState(defaultIndex);
  const id = useId();
  const activePanel = panels[active];

  return (
    <div className={`${mdxPanelClass} w-full space-y-3`}>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Code or content tabs">
        {panels.map((panel, index) => (
          <button
            key={panel.title + index}
            type="button"
            onClick={() => setActive(index)}
            className={mdxPillButtonClass(index === active)}
            role="tab"
            aria-selected={index === active}
            aria-controls={`${id}-panel-${index}`}
            id={`${id}-tab-${index}`}
          >
            {panel.title}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        className="w-full"
      >
        {activePanel ? activePanel.content : emptyState}
      </div>
      {!activePanel?.isSnippet && caption ? <Caption className="mt-1">{caption}</Caption> : null}
    </div>
  );
}
