function collectText(node) {
  if (!node) return "";

  if (typeof node.value === "string") {
    return node.value;
  }

  if (Array.isArray(node.children)) {
    return node.children.map(collectText).join("");
  }

  return "";
}

function isPlainTextParagraph(node) {
  if (node.type !== "paragraph") return false;

  return Array.isArray(node.children) && node.children.every(child => child.type === "text");
}

function looksLikeFrontmatter(nodes) {
  if (nodes.length === 0) return false;

  let hasKeyValue = false;

  for (const node of nodes) {
    if (node.type === "yaml") continue;

    if (!isPlainTextParagraph(node)) {
      return false;
    }

    const text = collectText(node).trim();
    if (!text) continue;

    if (text.includes(":")) {
      hasKeyValue = true;
    } else {
      return false;
    }
  }

  return hasKeyValue;
}

function isWhitespaceText(node) {
  return node?.type === "text" && typeof node.value === "string" && !node.value.trim();
}

const SKIP_TYPES = new Set(["mdxjsEsm", "mdxFlowExpression"]);

function isSkippable(node) {
  return node && (SKIP_TYPES.has(node.type) || isWhitespaceText(node));
}

function trimWhitespaceAround(children, startIndex, endIndex) {
  while (startIndex > 0 && isWhitespaceText(children[startIndex - 1])) {
    startIndex--;
  }

  while (endIndex + 1 < children.length && isWhitespaceText(children[endIndex + 1])) {
    endIndex++;
  }

  return [startIndex, endIndex];
}

function removeFrontmatter() {
  return tree => {
    if (!tree || !Array.isArray(tree.children) || tree.children.length === 0) {
      return;
    }

    const { children } = tree;

    let startIndex = 0;
    while (startIndex < children.length && isSkippable(children[startIndex])) {
      startIndex++;
    }

    if (startIndex >= children.length) {
      return;
    }

    const first = children[startIndex];

    if (first.type === "yaml") {
      const [start, end] = trimWhitespaceAround(children, startIndex, startIndex);
      children.splice(start, end - start + 1);
      return;
    }

    if (first.type !== "thematicBreak") {
      return;
    }

    let closingIndex = -1;
    for (let i = startIndex + 1; i < children.length; i++) {
      if (children[i].type === "thematicBreak") {
        closingIndex = i;
        break;
      }
    }

    if (closingIndex === -1) {
      return;
    }

    const between = children
      .slice(startIndex + 1, closingIndex)
      .filter(node => !isSkippable(node));

    if (!looksLikeFrontmatter(between)) {
      return;
    }

    const [start, end] = trimWhitespaceAround(children, startIndex, closingIndex);
    children.splice(start, end - start + 1);
  };
}

module.exports = removeFrontmatter;
module.exports.default = removeFrontmatter;
