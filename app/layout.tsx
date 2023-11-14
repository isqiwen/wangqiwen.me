import "./globals.css";

import { Inter } from "next/font/google";
import { themeEffect } from "./theme-effect";
import { Analytics } from "./analytics";
import { Header } from "./header";
import { Footer } from "./footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Wang QiWen's blog",
  description:
    "Wang QiWen is the CEO and founder of Vercel, a software engineer, and the creator of Next.js, Mongoose, Socket.io and other open source libraries.",
  openGraph: {
    title: "Wang QiWeng's blog",
    description:
      "Wang QiWen is the CEO and founder of Vercel, a software engineer, and the creator of Next.js, Mongoose, Socket.io and other open source libraries.",
    url: "https://wangqiwen.xyz",
    siteName: "Wang QiWeng's blog",
  },
  twitter: {
    card: "summary_large_image",
    site: "@Wang QiWen",
    creator: "@Wang QiWen",
  },
  themeColor: "transparent",
  metadataBase: new URL("https://wangqiwen.xyz"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.className} antialiased`}
      suppressHydrationWarning={true}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(${themeEffect.toString()})();`,
          }}
        />
      </head>

      <body className="dark:text-gray-100 max-w-2xl m-auto">
        <main className="p-6 pt-3 md:pt-6 min-h-screen">
          <Header />
          {children}
        </main>

        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
