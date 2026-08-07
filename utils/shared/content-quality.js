function validateContentQuality(source, { articlePaths }) {
  const issues = [];
  const inspectedSource = maskCode(source);

  validateImageAltText(inspectedSource, issues);
  validateHeadingOrder(inspectedSource, issues);
  validateArticleLinks(inspectedSource, articlePaths, issues);

  return issues;
}

function validateImageAltText(source, issues) {
  const markdownImage = /!\[([^\]]*)\]\(/g;
  let match;

  while ((match = markdownImage.exec(source))) {
    if (!match[1].trim()) {
      issues.push(issueAt(source, match.index, "image is missing alt text"));
    }
  }

  const imageTags = [/<img\b[^>]*>/g, /<Image\b[\s\S]*?\/>/g];
  for (const imageTag of imageTags) {
    while ((match = imageTag.exec(source))) {
      const tag = match[0];
      const alt = tag.match(
        /\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/
      );

      if (!alt || isEmptyAltValue(alt)) {
        issues.push(issueAt(source, match.index, "image is missing alt text"));
      }
    }
  }
}

function validateHeadingOrder(source, issues) {
  const headings = /^(#{1,6})\s+\S.*$/gm;
  let previousLevel = 0;
  let match;

  while ((match = headings.exec(source))) {
    const level = match[1].length;
    const line = getLineNumber(source, match.index);

    if (level === 1) {
      issues.push(
        `line ${line}: do not use h1; article metadata renders the page h1`
      );
    } else if (previousLevel === 0 && level !== 2) {
      issues.push(`line ${line}: first heading must be h2, found h${level}`);
    } else if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push(
        `line ${line}: heading level jumps from h${previousLevel} to h${level}`
      );
    }

    previousLevel = level;
  }
}

function validateArticleLinks(source, articlePaths, issues) {
  const found = new Set();
  const markdownLink =
    /!?\[[^\]]*\]\(\s*(\/\d{4}\/[a-z0-9]+(?:-[a-z0-9]+)*\/?)(?:[?#][^\s)]*)?[^)]*\)/g;
  const jsxLink =
    /\bhref\s*=\s*["'](\/\d{4}\/[a-z0-9]+(?:-[a-z0-9]+)*\/?)(?:[?#][^"']*)?["']/g;

  for (const expression of [markdownLink, jsxLink]) {
    let match;
    while ((match = expression.exec(source))) {
      const path = match[1].replace(/\/$/, "");
      const identifier = `${match.index}:${path}`;
      if (articlePaths.has(path) || found.has(identifier)) continue;

      found.add(identifier);
      issues.push(
        issueAt(
          source,
          match.index,
          `internal article link "${path}" does not exist`
        )
      );
    }
  }
}

function isEmptyAltValue(match) {
  const literal = match[1] ?? match[2];
  if (literal != null) {
    return literal.trim().length === 0;
  }

  const expression = (match[3] ?? "").trim();
  if (!expression) return true;

  const stringLiteral = expression.match(/^["']([\s\S]*)["']$/);
  return stringLiteral ? stringLiteral[1].trim().length === 0 : false;
}

function maskCode(source) {
  return source
    .replace(/```[\s\S]*?```/g, maskNonNewlineCharacters)
    .replace(/`[^`\n]*`/g, maskNonNewlineCharacters);
}

function maskNonNewlineCharacters(value) {
  return value.replace(/[^\n]/g, " ");
}

function issueAt(source, index, message) {
  return `line ${getLineNumber(source, index)}: ${message}`;
}

function getLineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

module.exports = {
  validateContentQuality,
};
