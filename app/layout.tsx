import "@/styles/globals.css";
import { getLanguageFromCookies } from "@/utils/server/get-language";
import { themeEffect } from "./themes/theme-effect";
import { Analytics } from "./analytics";
import { Header } from "./header";
import { Footer } from "./footer";
import { doge } from "./doge";
import ProgressBar from "./progress-bar";
import { getDictionary } from "@/locales/dictionary";
import DictionaryProvider from "@/locales/DictionaryProvider";
import { siteConfig } from "@/utils/site-config";
import { ensureEnvironmentWarnings } from "@/utils/server/env-warnings";

export const metadata = {
  title: siteConfig.site.title,
  description: siteConfig.site.description,
  openGraph: {
    title: siteConfig.site.title,
    description: siteConfig.site.description,
    url: siteConfig.site.url,
    siteName: siteConfig.site.title,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    site: `@${siteConfig.social.primary.handle}`,
    creator: `@${siteConfig.social.primary.handle}`,
  },
  metadataBase: new URL(siteConfig.site.url),
};

export const viewport = {
  themeColor: "transparent",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  ensureEnvironmentWarnings();
  const language = await getLanguageFromCookies();
  const dictionary = await getDictionary();

  return (
    <html
      lang={language}
      suppressHydrationWarning={true}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(${themeEffect.toString()})();(${doge.toString()})();`,
          }}
        />
      </head>

      <body className="dark:text-gray-100 max-w-2xl m-auto">
        <ProgressBar />
        <DictionaryProvider dictionary={dictionary}>
          <main className="p-6 pt-3 md:pt-6 min-h-screen">
            <Header dict={dictionary} language={language} />
            {children}
          </main>

          <Footer dict={dictionary} language={language} />
        </DictionaryProvider>
        <Analytics />
      </body>
    </html>
  );
}
