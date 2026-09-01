import { A } from "./(post)/components/a";
import { getAuthorName, getFooterContent, siteConfig } from "@/utils/site-config";

export function Footer() {
  const authorName = getAuthorName();
  const footer = getFooterContent();

  return (
    <footer className="mt-3 p-6 pb-6 pt-3 font-mono text-xs text-gray-500 dark:text-gray-400">
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
      {footer.icpRegistration ? (
        <div className="mt-4 text-center">
          <p className="font-medium text-gray-600 dark:text-gray-300">
            <A href={footer.icpRegistration.url}>
              {footer.icpRegistration.label}
            </A>
          </p>
        </div>
      ) : null}
    </footer>
  );
}
