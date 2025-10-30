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

const SKIP_TYPES = new Set(["mdxjsEsm", "mdxFlowExpression"]);

function removeFrontmatter() {
  return tree => {
    if (!tree || !Array.isArray(tree.children) || tree.children.length === 0) {
      return;
    }

    const { children } = tree;

    let startIndex = 0;
    while (startIndex < children.length && SKIP_TYPES.has(children[startIndex].type)) {
      startIndex++;
    }

    if (startIndex >= children.length) {
      return;
    }

    const first = children[startIndex];

    if (first.type === "yaml") {
      children.splice(startIndex, 1);
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

    const between = children.slice(startIndex + 1, closingIndex);

    if (!looksLikeFrontmatter(between)) {
      return;
    }

    children.splice(startIndex, closingIndex - startIndex + 1);
  };
}

module.exports = removeFrontmatter;
module.exports.default = removeFrontmatter;
