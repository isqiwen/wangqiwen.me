"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { uiCopy } from "@/utils/ui-copy";

type TableOfContentsItem = {
  id: string;
  level: 2 | 3;
  title: string;
};

const HEADING_SELECTOR = "h2[id], h3[id]";
const ACTIVE_HEADING_OFFSET = 112;
const CONTENT_END_THRESHOLD = 2;
const TOC_SCROLL_PADDING = 12;

export function TableOfContents() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLElement>(null);
  const [items, setItems] = useState<TableOfContentsItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const root = document.querySelector<HTMLElement>("[data-post-content]");
      if (!root) {
        setItems([]);
        return;
      }

      const nextItems = Array.from(
        root.querySelectorAll<HTMLHeadingElement>(HEADING_SELECTOR)
      ).map(heading => ({
        id: heading.id,
        level: Number(heading.tagName.slice(1)) as 2 | 3,
        title:
          heading.dataset.headingTitle ||
          heading.textContent?.replace(/^#/, "").trim() ||
          heading.id,
      }));

      setItems(nextItems);
      setActiveId(nextItems[0]?.id ?? "");
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    let frame = 0;

    const updateActiveHeading = () => {
      frame = 0;
      let nextActiveId = items[0].id;
      const content = document.querySelector<HTMLElement>(
        "[data-post-content]"
      );
      const hasReachedContentEnd =
        content !== null &&
        content.getBoundingClientRect().bottom <=
          window.innerHeight + CONTENT_END_THRESHOLD;

      if (hasReachedContentEnd) {
        nextActiveId = items[items.length - 1].id;
      } else {
        for (const item of items) {
          const heading = document.getElementById(item.id);
          if (
            heading &&
            heading.getBoundingClientRect().top <= ACTIVE_HEADING_OFFSET
          ) {
            nextActiveId = item.id;
          } else {
            break;
          }
        }
      }

      setActiveId(currentId =>
        currentId === nextActiveId ? currentId : nextActiveId
      );
    };

    const scheduleUpdate = () => {
      if (!frame) {
        frame = requestAnimationFrame(updateActiveHeading);
      }
    };

    updateActiveHeading();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [items]);

  useEffect(() => {
    if (!activeId) {
      return;
    }

    const container = containerRef.current;
    const activeLink = container?.querySelector<HTMLElement>(
      '[aria-current="location"]'
    );
    if (!container || !activeLink) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeLink.getBoundingClientRect();
    if (activeRect.top < containerRect.top + TOC_SCROLL_PADDING) {
      container.scrollTop -=
        containerRect.top + TOC_SCROLL_PADDING - activeRect.top;
    } else if (activeRect.bottom > containerRect.bottom - TOC_SCROLL_PADDING) {
      container.scrollTop +=
        activeRect.bottom - (containerRect.bottom - TOC_SCROLL_PADDING);
    }
  }, [activeId]);

  if (items.length === 0) {
    return null;
  }

  return (
    <aside
      ref={containerRef}
      className="sticky top-6 col-start-1 row-start-1 mr-8 hidden max-h-[calc(100vh-3rem)] w-[calc(100%-2rem)] max-w-56 self-start justify-self-end overflow-y-auto min-[1200px]:block"
      aria-label={uiCopy.post.tableOfContents}
    >
      <nav>
        <p className="text-base font-bold text-gray-900 dark:text-gray-100">
          {uiCopy.post.tableOfContents}
        </p>
        <ol className="ml-2 mt-3 border-l border-gray-200 dark:border-gray-700">
          {items.map(item => {
            const isActive = item.id === activeId;

            return (
              <li key={item.id}>
                <a
                  aria-current={isActive ? "location" : undefined}
                  className={`
                    relative block py-1.5 pr-2 text-sm leading-5 transition-colors
                    ${item.level === 3 ? "pl-7" : "pl-4"}
                    ${
                      isActive
                        ? "font-medium text-gray-900 dark:text-gray-100"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-500 dark:hover:text-gray-200"
                    }
                  `}
                  href={`#${item.id}`}
                >
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 -left-[6px] flex w-3 items-center justify-center bg-[#fcfcfc] dark:bg-[#1c1c1c]"
                    >
                      <span className="h-[10px] w-[10px] bg-blue-600 [clip-path:polygon(0_0,100%_50%,0_100%)] dark:bg-blue-400" />
                    </span>
                  ) : null}
                  {item.title}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
