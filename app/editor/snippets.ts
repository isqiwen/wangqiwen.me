export type ComponentSnippet = {
  label: string;
  hint: string;
  snippet: string;
};

export const componentsPalette: ComponentSnippet[] = [
  {
    label: "Heading & Paragraph",
    hint: "h1/h2/p 示例",
    snippet: `# 一级标题

## 二级标题

这是一个段落，包含行内代码 \`const ready = true;\`。`,
  },
  {
    label: "Link / Blockquote",
    hint: "基础文本组件",
    snippet: `这里有一个[外部链接](https://nextjs.org)。

> 自定义 Blockquote 示例，支持暗色模式。`,
  },
  {
    label: "Snippet",
    hint: "Code block with caption",
    snippet: `<Snippet caption="示例代码块">
{ \`console.log("hello");\` }
</Snippet>`,
  },
  {
    label: "Tabs",
    hint: "Tabbed code blocks",
    snippet: `<Tabs caption="同一逻辑的不同语言写法">
  <Tab title="JavaScript">

\`\`\`js
export function formatViews(value) {
  return new Intl.NumberFormat("zh-CN").format(value);
}
\`\`\`

  </Tab>
  <Tab title="TypeScript">

\`\`\`ts
type Stat = { label: string; value: number };

export const summarize = (items: Stat[]): number =>
  items.reduce((sum, item) => sum + item.value, 0);
\`\`\`

  </Tab>
</Tabs>`,
  },
  {
    label: "Stats",
    hint: "指标卡片",
    snippet: `<Stats>
  <Stat value="20+" label="组件数量" trend="持续增加" />
  <Stat value="100%" label="MDX 支持" trend="写作即渲染" />
</Stats>`,
  },
  {
    label: "Table",
    hint: "表格组件",
    snippet: `<Table>
  <THead>
    <TR>
      <TH>组件</TH>
      <TH>用途</TH>
      <TH>SSR</TH>
    </TR>
  </THead>
  <TBody>
    <TR>
      <TD>Tabs / Snippet</TD>
      <TD>展示代码与多语言切换</TD>
      <TD>是</TD>
    </TR>
  </TBody>
</Table>`,
  },
  {
    label: "Callout",
    hint: "Info / warning / success",
    snippet: `<Callout type="info">提示内容</Callout>`,
  },
  {
    label: "Image / Figure",
    hint: "带说明的图片",
    snippet: `<Figure>
  <Image src="/images/rauchg-3d4cecf.gray.jpg" alt="示例图片" width={null} height={null} />
</Figure>`,
  },
  {
    label: "YouTube",
    hint: "嵌入视频",
    snippet: `<YouTube id="dQw4w9WgXcQ" />`,
  },
  {
    label: "Footnotes",
    hint: "脚注与引用",
    snippet: `带脚注的文本<Ref id={1}/>，以及第二个脚注<Ref id={2}/>\n\n<FootNotes>\n  <FootNote id={1}>脚注 1 内容</FootNote>\n  <FootNote id={2}>脚注 2 内容</FootNote>\n</FootNotes>`,
  },
  {
    label: "QuoteCard",
    hint: "Highlighted quote",
    snippet: `<QuoteCard
  quote="保持持续写作"
  author="作者名"
  role="角色描述"
/>`,
  },
  {
    label: "StepPanel",
    hint: "Step-by-step with copy",
    snippet: `<StepPanel
  steps={[
    { title: "安装依赖", body: "pnpm install", code: "pnpm install" },
    { title: "启动开发服", body: "pnpm dev --filter blog", code: "pnpm dev --filter blog" },
  ]}
/>`,
  },
  {
    label: "Timeline",
    hint: "Chronological items",
    snippet: `<Timeline>
  <TimelineItem title="节点一" time="09:00">说明</TimelineItem>
  <TimelineItem title="节点二" time="10:00">说明</TimelineItem>
</Timeline>`,
  },
  {
    label: "Accordion",
    hint: "Collapsible FAQs",
    snippet: `<Accordion>
  <AccordionItem title="问题一" open>回答</AccordionItem>
  <AccordionItem title="问题二">回答</AccordionItem>
</Accordion>`,
  },
  {
    label: "StatGrid",
    hint: "KPI cards with sparkline",
    snippet: `<StatGrid>
  <KPI label="访客" value="3.2K" delta="+12%" spark={[1,2,3,4,3,5]} />
  <KPI label="分享" value="420" delta="+5%" spark={[0.5,1,1.5,2,2.5]} />
</StatGrid>`,
  },
  {
    label: "Gallery",
    hint: "Image gallery",
    snippet: `<Gallery
  images={[
    { src: "https://picsum.photos/800/600?1", alt: "图1", caption: "说明1" },
    { src: "https://picsum.photos/800/600?2", alt: "图2", caption: "说明2" },
  ]}
/>`,
  },
  {
    label: "ImageGrid",
    hint: "Clickable image grid",
    snippet: `<ImageGrid
  images={[
    { src: "https://picsum.photos/400/300?1", caption: "图1" },
    { src: "https://picsum.photos/400/300?2", caption: "图2" },
  ]}
/>`,
  },
  {
    label: "VideoPlayer",
    hint: "Video with chapters/danmaku",
    snippet: `<VideoPlayer
  src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
  title="视频示例"
  chapters={[{ label: "开头", time: 0 }, { label: "花开", time: 1 }]}
  danmaku={[{ time: 0.5, text: "🌸" }]}
/>`,
  },
  {
    label: "AudioPlayer",
    hint: "Embed audio/podcast",
    snippet: `<AudioPlayer
  src="https://file-examples.com/storage/fe1afdf45b8e85b2e1fae03/2017/11/file_example_MP3_700KB.mp3"
  title="音频示例"
  subtitle="播客段落"
/>`,
  },
  {
    label: "Compare",
    hint: "Side-by-side text/code",
    snippet: `<Compare
  leftTitle="方案A"
  rightTitle="方案B"
  left="描述 A"
  right="描述 B"
/>`,
  },
  {
    label: "Diff",
    hint: "Before vs After",
    snippet: `<Diff
  beforeTitle="Before"
  afterTitle="After"
  before={'console.log("before");'}
  after={'console.log("after");'}
/>`,
  },
  {
    label: "KeyValueList",
    hint: "Label/value grid",
    snippet: `<KeyValueList>
  <KeyValueItem label="键1" value="值1" />
  <KeyValueItem label="键2" value="值2" />
</KeyValueList>`,
  },
  {
    label: "Steps",
    hint: "Numbered steps",
    snippet: `<Steps title="流程">
  <Step title="第一步">说明</Step>
  <Step title="第二步">说明</Step>
</Steps>`,
  },
  {
    label: "PullQuote",
    hint: "Emphasized quote",
    snippet: `<PullQuote author="作者">引用内容</PullQuote>`,
  },
  {
    label: "Timeline (short)",
    hint: "Single items",
    snippet: `<Timeline>
  <TimelineItem title="节点" time="09:00">说明</TimelineItem>
</Timeline>`,
  },
];
