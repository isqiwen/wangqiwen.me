function validateContentQuality(source, { articlePaths }) {
  const issues = [];
  const inspectedSource = maskCode(source);

  validateImageAltText(inspectedSource, issues);
  validateHeadingOrder(inspectedSource, issues);
  validateArticleLinks(inspectedSource, articlePaths, issues);
  validateCitations(inspectedSource, issues);
  validateCrossReferences(inspectedSource, issues);
  validateSourceExcerpts(inspectedSource, issues);

  return issues;
}

function validateSourceExcerpts(source, issues) {
  const sourceExcerpt = /<SourceExcerpt\b([\s\S]*?)\/>/g;
  let match;

  while ((match = sourceExcerpt.exec(source))) {
    const attributes = match[1];
    if (!getStringAttribute(attributes, "source")) {
      issues.push(
        issueAt(source, match.index, "source excerpt is missing a source identity")
      );
    }

    const facsimile = attributes.match(/\bfacsimile\s*=\s*\{\{([\s\S]*?)\}\}/);
    if (!facsimile) continue;

    const alt = facsimile[1].match(/\balt\s*:\s*(?:"([^"]*)"|'([^']*)')/);
    if (!alt || !(alt[1] ?? alt[2] ?? "").trim()) {
      issues.push(
        issueAt(source, match.index, "source excerpt facsimile is missing alt text")
      );
    }
  }
}

function validateCrossReferences(source, issues) {
  const targets = collectReferenceTargets(source, issues);
  const crossReference = /<CrossReference\b([\s\S]*?)\/>/g;
  let match;

  while ((match = crossReference.exec(source))) {
    const attributes = match[1];
    const rawTarget = getStringAttribute(attributes, "target");
    const label = getStringAttribute(attributes, "label");
    const target = rawTarget.replace(/^#/, "");

    if (!target) {
      issues.push(
        issueAt(source, match.index, "cross reference is missing a target")
      );
      continue;
    }

    if (!label) {
      issues.push(
        issueAt(
          source,
          match.index,
          `cross reference "${target}" is missing a label`
        )
      );
    }

    if (!targets.has(target)) {
      issues.push(
        issueAt(
          source,
          match.index,
          `cross reference target "${target}" does not exist in this article`
        )
      );
    }
  }
}

function collectReferenceTargets(source, issues) {
  const targets = new Map();
  const referenceableComponent =
    /<(Definition|TheoremBlock|Algorithm|MathBlock|Figure|Table|Chart|RegressionTable|SourceExcerpt|ScatterPlot|Histogram|BoxPlot)\b([\s\S]*?)(?:\/>|>)/g;
  const equationGroup = /<EquationGroup\b([\s\S]*?)\/>/g;
  const manualHeading = /^#{1,6}\s+.*?\s+\[#([^\]]+)\]\s*$/gm;
  const definition = /<Definition\b([\s\S]*?)(?:\/>|>)/g;
  let match;

  while ((match = referenceableComponent.exec(source))) {
    addReferenceTarget(
      targets,
      getStringAttribute(match[2], "id"),
      match.index,
      source,
      issues
    );
  }

  while ((match = equationGroup.exec(source))) {
    const idAttribute = /\bid\s*(?:=|:)\s*(["'])(.*?)\1/g;
    let idMatch;

    while ((idMatch = idAttribute.exec(match[1]))) {
      addReferenceTarget(
        targets,
        idMatch[2],
        match.index + idMatch.index,
        source,
        issues
      );
    }
  }

  while ((match = manualHeading.exec(source))) {
    addReferenceTarget(targets, match[1], match.index, source, issues);
  }

  while ((match = definition.exec(source))) {
    if (!getStringAttribute(match[1], "id")) {
      issues.push(
        issueAt(source, match.index, "definition is missing a stable id")
      );
    }
  }

  return targets;
}

function addReferenceTarget(targets, rawId, index, source, issues) {
  const id = rawId.trim();
  if (!id) return;

  if (targets.has(id)) {
    issues.push(
      issueAt(source, index, `reference target "${id}" is duplicated`)
    );
    return;
  }

  targets.set(id, index);
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

function validateCitations(source, issues) {
  const bibliographyItems = new Map();
  const bibliographyItem = /<BibliographyItem\b([\s\S]*?)(?:\/>|>)/g;
  let match;

  while ((match = bibliographyItem.exec(source))) {
    const attributes = match[1];
    const id = getStringAttribute(attributes, "id");
    const label = getStringAttribute(attributes, "label");

    if (!id) {
      issues.push(
        issueAt(source, match.index, "bibliography item is missing an id")
      );
      continue;
    }

    if (!label) {
      issues.push(
        issueAt(
          source,
          match.index,
          `bibliography item "${id}" is missing a label`
        )
      );
      continue;
    }

    if (bibliographyItems.has(id)) {
      issues.push(
        issueAt(source, match.index, `bibliography item "${id}" is duplicated`)
      );
      continue;
    }

    bibliographyItems.set(id, label);
  }

  const citation = /<Citation\b([\s\S]*?)\/>/g;
  while ((match = citation.exec(source))) {
    const attributes = match[1];
    const refId = getStringAttribute(attributes, "refId");
    const label = getStringAttribute(attributes, "label");

    if (!refId) {
      issues.push(issueAt(source, match.index, "citation is missing a refId"));
      continue;
    }

    if (!label) {
      issues.push(
        issueAt(source, match.index, `citation "${refId}" is missing a label`)
      );
      continue;
    }

    const bibliographyLabel = bibliographyItems.get(refId);
    if (!bibliographyLabel) {
      issues.push(
        issueAt(
          source,
          match.index,
          `citation "${refId}" does not match a bibliography item`
        )
      );
    } else if (bibliographyLabel !== label) {
      issues.push(
        issueAt(
          source,
          match.index,
          `citation "${refId}" label "${label}" does not match bibliography label "${bibliographyLabel}"`
        )
      );
    }
  }
}

function getStringAttribute(attributes, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`);
  const match = attributes.match(pattern);
  return match?.[2]?.trim() || "";
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
