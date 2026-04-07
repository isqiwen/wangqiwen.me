import { A } from "./(post)/components/a";
import type { Locale } from "@/locales/config";
import { getAuthorName, getFooterContent, siteConfig } from "@/utils/site-config";

export function Footer({ language }: { dict: any; language: Locale }) {
  const authorName = getAuthorName(language);
  const footer = getFooterContent(language);

  return (
    <footer className="p-6 pt-3 pb-6 mt-3 text-xs dark:text-gray-400 text-gray-500 font-mono">
      <div className="flex items-center gap-4 text-center">
        <div className="grow text-left">
          {authorName} (
          <A target="_blank" rel="noreferrer" href={siteConfig.social.primary.url}>
            @{siteConfig.social.primary.handle}
          </A>
          )
        </div>
        {siteConfig.project.sourceUrl ? (
          <div>
            <A target="_blank" rel="noreferrer" href={siteConfig.project.sourceUrl}>
              {footer.sourceLabel}
            </A>
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-left text-[11px] text-gray-400">{footer.note}</p>
    </footer>
  );
}
