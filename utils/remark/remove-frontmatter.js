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

module.exports = function removeFrontmatter() {
  return tree => {
    if (!tree || !Array.isArray(tree.children) || tree.children.length === 0) {
      return;
    }

    const [first] = tree.children;

    if (first.type === "yaml") {
      tree.children.shift();
      return;
    }

    if (first.type !== "thematicBreak") {
      return;
    }

    let closingIndex = -1;
    for (let i = 1; i < tree.children.length; i++) {
      if (tree.children[i].type === "thematicBreak") {
        closingIndex = i;
        break;
      }
    }

    if (closingIndex === -1) {
      return;
    }

    const between = tree.children.slice(1, closingIndex);

    if (!looksLikeFrontmatter(between)) {
      return;
    }

    tree.children.splice(0, closingIndex + 1);
  };
};
