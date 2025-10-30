import redis from "./redis";
import commaNumber from "comma-number";
import { join } from "path";
import { readdir, readFile, stat } from "fs/promises";
import { runInNewContext } from "vm";

export type Post = {
  id: string;
  date: string;
  title: string;
  zh_title: string;
  views: number;
  viewsFormatted: string;
};

type Frontmatter = {
  title?: string;
  zhTitle?: string;
  publishedAt?: string;
};

type PostMetadata = {
  id: string;
  title: string;
  zh_title: string;
  date: string;
  publishedAt: Date;
};

const EN_POSTS_DIR = join(process.cwd(), "app", "(post)", "en");

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

async function loadPostsMetadata(): Promise<PostMetadata[]> {
  const years = await readdir(EN_POSTS_DIR);
  const posts: PostMetadata[] = [];

  for (const year of years) {
    const yearPath = join(EN_POSTS_DIR, year);

    let yearInfo;
    try {
      yearInfo = await stat(yearPath);
    } catch {
      continue;
    }

    if (!yearInfo.isDirectory()) continue;

    const candidates = await readdir(yearPath);
    for (const candidate of candidates) {
      const postDir = join(yearPath, candidate);

      let postInfo;
      try {
        postInfo = await stat(postDir);
      } catch {
        continue;
      }

      if (!postInfo.isDirectory()) continue;

      const pagePath = join(postDir, "page.mdx");

      let fileContents: string;
      try {
        fileContents = await readFile(pagePath, "utf8");
      } catch {
        continue;
      }

      const { title, zhTitle, publishedAt: publishedAtRaw } =
        parseFileMetadata(fileContents);

      if (!title || !publishedAtRaw) continue;

      const publishedAt = new Date(publishedAtRaw);
      if (Number.isNaN(publishedAt.getTime())) continue;

      posts.push({
        id: candidate,
        title,
        zh_title: zhTitle ?? title,
        date: DATE_FORMATTER.format(publishedAt),
        publishedAt,
      });
    }
  }

  posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  return posts;
}

function parseFileMetadata(fileContents: string): Frontmatter {
  const metadata = parseExportedMetadata(fileContents);
  const frontmatter = parseFrontmatter(fileContents);

  return {
    title: metadata.title ?? frontmatter.title,
    zhTitle: metadata.zhTitle ?? frontmatter.zhTitle,
    publishedAt: metadata.publishedAt ?? frontmatter.publishedAt,
  };
}

function parseExportedMetadata(fileContents: string): Frontmatter {
  const exportIndex = fileContents.indexOf("export const metadata");
  if (exportIndex === -1) {
    return {};
  }

  const objectLiteral = extractObjectLiteral(fileContents, exportIndex);
  if (!objectLiteral) {
    return {};
  }

  try {
    const metadata = runInNewContext(`(${objectLiteral})`);
    if (!metadata || typeof metadata !== "object") {
      return {};
    }

    const result: Frontmatter = {};

    const title = getTitleValue((metadata as Record<string, unknown>).title);
    if (title) {
      result.title = title;
    }

    const zhTitle = (metadata as Record<string, unknown>).zhTitle;
    if (typeof zhTitle === "string") {
      result.zhTitle = zhTitle;
    }

    const publishedAt = (metadata as Record<string, unknown>).publishedAt;
    if (typeof publishedAt === "string") {
      result.publishedAt = publishedAt;
    }

    return result;
  } catch {
    return {};
  }
}

function getTitleValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.default === "string") {
      return record.default;
    }
  }

  return undefined;
}

function extractObjectLiteral(
  source: string,
  exportIndex: number,
): string | null {
  const braceStart = source.indexOf("{", exportIndex);
  if (braceStart === -1) {
    return null;
  }

  let depth = 0;
  let inString: string | null = null;
  let escaped = false;

  for (let i = braceStart; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      inString = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart, i + 1);
      }
    }
  }

  return null;
}

function parseFrontmatter(fileContents: string): Frontmatter {
  const match = fileContents.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const [, body] = match;
  const data: Frontmatter = {};
  const lines = body.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (!key) continue;

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    (data as Record<string, string>)[key] = value;
  }

  return data;
}

// shape of the HSET in redis
type Views = {
  [key: string]: string;
};

export const getPosts = async () => {
  const allViews: null | Views = await redis.hgetall("views");
  const metadata = await loadPostsMetadata();
  const posts = metadata.map((post): Post => {
    const views = Number(allViews?.[post.id] ?? 0);
    return {
      id: post.id,
      title: post.title,
      zh_title: post.zh_title,
      date: post.date,
      views,
      viewsFormatted: commaNumber(views),
    };
  });
  return posts;
};
