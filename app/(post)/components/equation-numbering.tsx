"use client";

import { useEffect } from "react";

type EquationNumberingProps = {
  rootSelector?: string;
  startAt?: number;
};

export function EquationNumbering({
  rootSelector = '[data-equation-root="true"]',
  startAt = 1,
}: EquationNumberingProps) {
  useEffect(() => {
    let frame = 0;

    const applyNumbering = () => {
      const root =
        document.querySelector<HTMLElement>(rootSelector) ?? document.body;

      const equations = Array.from(
        root.querySelectorAll<HTMLElement>(
          '[data-equation-id]:not([data-equation-numbering="manual"])',
        ),
      );

      equations.forEach((equation, index) => {
        const number = startAt + index;
        const label = `(${number})`;

        if (equation.getAttribute("data-equation-number") !== String(number)) {
          equation.setAttribute("data-equation-number", String(number));
        }

        if (equation.getAttribute("data-equation-label") !== label) {
          equation.setAttribute("data-equation-label", label);
        }

        const slot = equation.querySelector<HTMLElement>(
          "[data-equation-label-slot]",
        );

        if (slot && slot.textContent !== label) {
          slot.textContent = label;
        }
      });
    };

    const scheduleApply = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(applyNumbering);
    };

    scheduleApply();

    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-equation-id",
        "data-equation-numbering",
        "data-equation-label",
      ],
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [rootSelector, startAt]);

  return null;
}
