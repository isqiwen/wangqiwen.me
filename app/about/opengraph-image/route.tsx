// Rendered once at build time: nothing in it changes between deployments.
export const dynamic = "force-static";

import { ImageResponse } from "next/og";
import { getPosts } from "@/app/get-posts";
import { readFileSync } from "fs";
import { join } from "path";
import {
  getAuthorName,
  getProfileHighlights,
  getPublicAssetPath,
  isAbsoluteUrl,
  siteConfig,
} from "@/utils/site-config";

const fontsDir = join(process.cwd(), "public", "fonts");

const inter300 = readFileSync(
  join(fontsDir, "inter-latin-300-normal.woff")
);

const inter500 = readFileSync(
  join(fontsDir, "inter-latin-500-normal.woff")
);

const robotoMono400 = readFileSync(
  join(fontsDir, "roboto-mono-latin-400-normal.woff")
);

export async function GET() {
  const posts = await getPosts();
  const portrait = await loadPortrait();
  const authorName = getAuthorName();
  const highlights = getProfileHighlights();

  return new ImageResponse(
    (
      <div
        tw="flex p-10 h-full w-full bg-white flex-col"
        style={font("Inter 300")}
      >
        <main tw="flex grow pt-4 w-full justify-center items-center">
          <div tw="flex flex-row">
            <div tw="flex">
              {portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  tw="rounded-full h-74 w-74 object-cover"
                  alt={authorName}
                  // @ts-ignore
                  src={portrait}
                />
              ) : (
                <div
                  tw="rounded-full h-74 w-74 bg-gray-100 items-center justify-center text-6xl text-gray-500"
                  style={font("Inter 500")}
                >
                  {authorName.slice(0, 1)}
                </div>
              )}
            </div>

            <div tw="flex flex-col px-10 grow text-[28px] h-70 justify-center">
              <div tw="text-[64px] mb-7" style={font("Inter 500")}>
                {authorName}
              </div>
              {highlights.map(highlight => (
                <div key={highlight} tw="flex mb-5" style={font("Roboto Mono 400")}>
                  <span tw="text-gray-400 mr-3">&mdash;</span> {highlight}
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer
          tw="flex w-full justify-center text-2xl text-gray-500"
          style={font("Roboto Mono 400")}
        >
          {posts.length} posts
        </footer>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter 300",
          data: inter300,
        },
        {
          name: "Inter 500",
          data: inter500,
        },
        {
          name: "Roboto Mono 400",
          data: robotoMono400,
        },
      ],
    }
  );
}

function font(fontFamily: string) {
  return { fontFamily };
}

// The renderer recognises raster images from their bytes. It cannot do that
// for SVG, which has to arrive as a data URL instead.
function toImageSource(buffer: Buffer, isSvg: boolean): string | ArrayBuffer {
  if (isSvg) {
    return `data:image/svg+xml;base64,${buffer.toString("base64")}`;
  }

  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

async function loadPortrait() {
  const portraitPath =
    siteConfig.author.images.avatarMuted || siteConfig.author.images.avatar;

  if (!portraitPath) {
    return null;
  }

  if (isAbsoluteUrl(portraitPath)) {
    const res = await fetch(portraitPath);
    if (!res.ok) {
      return null;
    }
    return toImageSource(
      Buffer.from(await res.arrayBuffer()),
      (res.headers.get("content-type") ?? "").includes("image/svg")
    );
  }

  try {
    return toImageSource(
      readFileSync(
        join(process.cwd(), "public", getPublicAssetPath(portraitPath))
      ),
      portraitPath.toLowerCase().endsWith(".svg")
    );
  } catch {
    return null;
  }
}
