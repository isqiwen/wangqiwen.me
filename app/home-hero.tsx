import Link from "next/link";
import type { Locale } from "@/locales/config";
import { getAuthorName, getAuthorTagline, getHomeContent } from "@/utils/site-config";

export function HomeHero({ language }: { language: Locale }) {
  const home = getHomeContent(language);
  const authorName = getAuthorName(language);
  const authorTagline = getAuthorTagline(language);

  return (
    <section className="mb-8 rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-gray-500">
          {home.eyebrow}
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">
            {home.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {authorName} · {authorTagline}
          </p>
          <p className="max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">
            {home.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={home.primaryAction.href}
            className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white shadow hover:bg-slate-700"
          >
            {home.primaryAction.label}
          </Link>
          {home.secondaryAction ? (
            <a
              href={home.secondaryAction.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              {home.secondaryAction.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
