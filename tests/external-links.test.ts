import assert from "node:assert/strict";
import test from "node:test";
import { extractExternalReferences } from "@/utils/external-links";

test("finds external links, image sources, local images, and tweet embeds", () => {
  const source = `
[An external link](https://example.com/article)
[A link with parentheses](https://en.wikipedia.org/wiki/Aether_(classical_element))
![A remote image](https://images.example.com/cover.png)
<a href="https://example.com/details">Details</a>
<img src="/images/local.png" alt="Local" />
<https://example.com/autolink>
<Tweet id="123456789" />
`;

  assert.deepEqual(extractExternalReferences(source), [
    { kind: "link", value: "https://example.com/article", line: 2 },
    {
      kind: "link",
      value: "https://en.wikipedia.org/wiki/Aether_(classical_element)",
      line: 3,
    },
    { kind: "image", value: "https://images.example.com/cover.png", line: 4 },
    { kind: "link", value: "https://example.com/details", line: 5 },
    { kind: "image", value: "/images/local.png", line: 6 },
    { kind: "link", value: "https://example.com/autolink", line: 7 },
    { kind: "tweet", value: "123456789", line: 8 },
  ]);
});

test("ignores local links and non-web URL schemes", () => {
  const source = `
[A local link](/2020/example)
<a href="mailto:hello@example.com">Email</a>
<img src="data:image/png;base64,abc" alt="Inline" />
`;

  assert.deepEqual(extractExternalReferences(source), []);
});
