import "./globals.css";
import { getLanguageFromCookies } from '@/utils/get-language';
import { themeEffect } from "./theme-effect";
import { Analytics } from "./analytics";
import { Header } from "./header";
import { Footer } from "./footer";
import { doge } from "./doge";

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
        <main className="p-6 pt-3 md:pt-6 min-h-screen">
          <Header language={language} />
          {children}
        </main>

        <Footer language={language} />
        <Analytics />
      </body>
    </html>
  );
}
