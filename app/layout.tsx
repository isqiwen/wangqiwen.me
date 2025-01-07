import "@/styles/globals.css";
import { Suspense } from "react";
import { getLanguageFromCookies } from '@/utils/get-language';
import { themeEffect } from "./themes/theme-effect";
import { Analytics } from "./analytics";
import { Header } from "./header";
import { Footer } from "./footer";
import { doge } from "./doge";
import ProgressBar from "./progress-bar"
import { getDictionary } from '@/locales/dictionary'
import DictionaryProvider from '@/locales/DictionaryProvider'

export const metadata = {
  title: "Wang QiWen's blog",
  description:
    "Wang QiWen is the CEO and founder of Vercel, a software engineer, and the creator of Next.js, Mongoose, Socket.io and other open source libraries.",
  openGraph: {
    title: "Wang QiWeng's blog",
    description:
      "Guillermo Rauch is the CEO and founder of Vercel, a software engineer, and the creator of Next.js, Mongoose, Socket.io and other open source libraries.",
    url: "https://rauchg.com",
    siteName: "Wang QiWen's blog",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@Wang QiWen",
    creator: "@Wang QiWen",
  },
  metadataBase: new URL("https://wangqiwen.xyz"),
};

export const viewport = {
  themeColor: "transparent",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = await getLanguageFromCookies();
  const dictionary = await getDictionary()

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
            <Suspense fallback={<div>Loading...</div>}>
              <Header dict={dictionary} language={language} />
            </Suspense>
            {children}
          </main>

          <Footer />
        </DictionaryProvider>
        <Analytics />
      </body>
    </html>
  );
}
