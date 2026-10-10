import "@/styles/globals.css";
import { preload } from "react-dom";
import { themeEffect } from "./themes/theme-effect";
import { Header } from "./header";
import { Footer } from "./footer";
import { doge } from "./doge";
import ProgressBar from "./progress-bar";
import { siteConfig } from "@/utils/site-config";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The interface font is needed for the first paint of every page. Without a
  // hint the browser finds it only after it has parsed the stylesheet.
  preload("/fonts/inter-latin-wght-normal.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html lang={siteConfig.site.language} suppressHydrationWarning={true}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(${themeEffect.toString()})();(${doge.toString()})();`,
          }}
        />
      </head>

      <body className="dark:text-gray-100 max-w-2xl m-auto">
        <ProgressBar />
        <main className="min-h-screen p-6 pt-3 md:pt-6">
          <Header />
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
