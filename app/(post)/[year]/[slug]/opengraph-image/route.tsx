export const revalidate = 60;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getPostByRoute } from "@/app/get-posts";
import { siteConfig } from "@/utils/site-config";

const fontsDir = join(process.cwd(), "public", "fonts");

const inter300 = readFileSync(join(fontsDir, "inter-latin-300-normal.woff"));

const inter500 = readFileSync(join(fontsDir, "inter-latin-500-normal.woff"));

const inter600 = readFileSync(join(fontsDir, "inter-latin-600-normal.woff"));

const robotoMono400 = readFileSync(
  join(fontsDir, "roboto-mono-latin-400-normal.woff")
);

type ArticleImageRouteProps = {
  params: Promise<{ year: string; slug: string }>;
};

export async function GET(
  _request: Request,
  { params }: ArticleImageRouteProps
) {
  const { year, slug } = await params;
  const post = await getPostByRoute(year, slug, { includeViews: false });

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        tw="flex h-full w-full flex-col bg-white p-10"
        style={font("Inter 300")}
      >
        <header tw="flex w-full text-[36px]">
          <div tw="font-bold" style={font("Inter 600")}>
            {siteConfig.site.name}
          </div>
          <div tw="grow" />
          <div tw="text-[28px]">{siteConfig.site.domain}</div>
        </header>

        <main tw="flex grow flex-col justify-center">
          <div
            tw="flex text-[24px] text-gray-500"
            style={font("Roboto Mono 400")}
          >
            {post.publishedAt}
          </div>
          <div
            tw="mt-5 flex max-w-[1050px] text-[64px] leading-[1.12] font-medium"
            style={font("Inter 500")}
          >
            {post.title}
          </div>
          <div tw="mt-7 flex max-w-[980px] text-[30px] leading-[1.35] text-gray-500">
            {post.description}
          </div>
        </main>

        <footer
          tw="flex text-[24px] text-gray-500"
          style={font("Roboto Mono 400")}
        >
          {siteConfig.site.domain}
        </footer>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter 300", data: inter300 },
        { name: "Inter 500", data: inter500 },
        { name: "Inter 600", data: inter600 },
        { name: "Roboto Mono 400", data: robotoMono400 },
      ],
    }
  );
}

function font(fontFamily: string) {
  return { fontFamily };
}
