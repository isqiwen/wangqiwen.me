import type { Metadata } from "next";
import { A } from "@/app/(post)/components/a";
import { RawImage } from "@/app/(post)/components/raw-image";
import {
  getAboutContent,
  getAuthorLocation,
  getAuthorName,
  getAuthorTagline,
  getPrimarySocialHandle,
  siteConfig,
} from "@/utils/site-config";

export function buildAboutMetadata(): Metadata {
  const about = getAboutContent();
  const title = `${about.title} | ${siteConfig.site.title}`;

  return {
    title,
    description: about.description,
    openGraph: {
      title,
      description: about.description,
      images: [{ url: "/about/opengraph-image" }],
    },
  };
}

export function AboutPage() {
  const about = getAboutContent();
  const authorName = getAuthorName();
  const authorTagline = getAuthorTagline();
  const authorLocation = getAuthorLocation();
  const primaryHandle = getPrimarySocialHandle();

  return (
    <article className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <RawImage
            src={siteConfig.author.images.avatar}
            alt={authorName}
            width={160}
            height={160}
            loading="eager"
            className="mx-auto h-32 w-32 rounded-full border border-gray-200 bg-gray-100 object-cover sm:mx-0 sm:h-40 sm:w-40 dark:border-gray-700 dark:bg-gray-900"
          />

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-gray-500">
                {about.title}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">
                {authorName}
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-300">
                {authorTagline}
              </p>
              <p className="font-mono text-xs text-gray-500">{authorLocation}</p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <A href={siteConfig.social.primary.url} target="_blank" rel="noreferrer">
                {primaryHandle}
              </A>
              <A href={siteConfig.social.github.url} target="_blank" rel="noreferrer">
                {siteConfig.social.github.label}
              </A>
            </div>

            <div className="space-y-3 text-[15px] leading-7 text-gray-700 dark:text-gray-300">
              {about.intro.map(paragraph => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {about.sections.map(section => (
          <section
            key={section.title}
            className="rounded-3xl border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <h2 className="mb-3 text-base font-semibold text-gray-950 dark:text-gray-100">
              {section.title}
            </h2>
            <ul className="space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {section.items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <section className="rounded-3xl border border-dashed border-gray-300 p-5 text-sm leading-7 text-gray-600 dark:border-gray-700 dark:text-gray-300">
        <p>{about.contact}</p>
      </section>
    </article>
  );
}
