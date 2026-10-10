import { validateContentQuality } from "@/utils/shared/content-quality";
import { parsePostFilePath } from "@/utils/shared/post-fields";
import { getUnknownTopics } from "@/utils/topics";
import { validateEditorSeries, validateEditorTarget } from "./document";
import type {
  EditorFileOption,
  EditorOutlineHeading,
  PublishReadinessCheck,
  PublishReadinessStatus,
} from "./types";

export function extractOutlineHeadings(source: string): EditorOutlineHeading[] {
  const headings: EditorOutlineHeading[] = [];
  let inCodeFence = false;
  let position = 0;

  for (const [index, line] of source.split("\n").entries()) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
    } else if (!inCodeFence) {
      const match = line.match(/^(#{2,4})\s+(.+?)\s*#*\s*$/);
      if (match) {
        const text = match[2].trim();
        if (text) {
          headings.push({
            level: match[1].length as 2 | 3 | 4,
            line: index + 1,
            position,
            text,
          });
        }
      }
    }

    position += line.length + 1;
  }

  return headings;
}

export function getContentQualityIssues(
  source: string,
  articlePaths: Set<string>
) {
  return validateContentQuality(source, { articlePaths }) as string[];
}

export function buildPublishReadiness({
  title,
  description,
  series,
  seriesOrder,
  publishedAt,
  id,
  tags,
  body,
  readingTimeEstimate,
  fileOptions,
}: {
  title: string;
  description: string;
  series: string;
  seriesOrder: string;
  publishedAt: string;
  id: string;
  tags: string[];
  body: string;
  readingTimeEstimate: number;
  fileOptions: EditorFileOption[];
}): PublishReadinessCheck[] {
  const targetError = validateEditorTarget(publishedAt, id);
  const seriesError = validateEditorSeries(series, seriesOrder);
  const unknownTopics = getUnknownTopics(tags);
  const articlePaths = new Set(
    fileOptions
      .filter(file => file.status === "published")
      .flatMap(file => {
        const routePath = getRoutePathFromPostFile(file.path);
        return routePath ? [routePath] : [];
      })
  );

  if (!targetError) {
    articlePaths.add(`/${publishedAt.slice(0, 4)}/${id}`);
  }

  const contentIssues = getContentQualityIssues(body, articlePaths);
  const imageIssues = contentIssues.filter(issue =>
    issue.includes("image is missing alt text")
  );
  const headingIssues = contentIssues.filter(issue =>
    issue.includes("heading")
  );
  const linkIssues = contentIssues.filter(issue =>
    issue.includes("internal article link")
  );

  return [
    createPublishReadinessCheck(
      "Article ID and published date",
      targetError ?? `Will publish at /${publishedAt.slice(0, 4)}/${id}`,
      targetError ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Title",
      title.trim() ? "Title is set." : "A title is required.",
      title.trim() ? "pass" : "fail"
    ),
    createPublishReadinessCheck(
      "Description",
      description.trim()
        ? "Search and sharing description is set."
        : "A search and sharing description is required.",
      description.trim() ? "pass" : "fail"
    ),
    createPublishReadinessCheck(
      "Topics",
      unknownTopics.length > 0
        ? `Unknown topics: ${unknownTopics.join(", ")}.`
        : tags.length > 0
        ? `${tags.length} topic${tags.length === 1 ? "" : "s"} selected.`
        : "No topic selected. Topics are recommended but optional.",
      unknownTopics.length > 0 ? "fail" : tags.length > 0 ? "pass" : "warning"
    ),
    createPublishReadinessCheck(
      "Series position",
      seriesError ??
        (series
          ? `Part ${seriesOrder} in ${series}.`
          : "Not part of a series."),
      seriesError ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Image alt text",
      imageIssues.length > 0
        ? imageIssues.join(" ")
        : "All images have alt text.",
      imageIssues.length > 0 ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Heading hierarchy",
      headingIssues.length > 0
        ? headingIssues.join(" ")
        : "Heading levels are valid.",
      headingIssues.length > 0 ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Internal article links",
      linkIssues.length > 0
        ? linkIssues.join(" ")
        : "All internal article links resolve.",
      linkIssues.length > 0 ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Estimated reading time",
      `${readingTimeEstimate} min read.`,
      "pass"
    ),
  ];
}

function createPublishReadinessCheck(
  label: string,
  detail: string,
  status: PublishReadinessStatus
): PublishReadinessCheck {
  return { label, detail, status };
}

function getRoutePathFromPostFile(filePath: string) {
  const match = parsePostFilePath(filePath);
  return match ? `/${match.year}/${match.slug}` : null;
}
