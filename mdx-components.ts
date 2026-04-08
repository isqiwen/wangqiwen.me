import { A as a } from "app/(post)/components/a";
import { P as p } from "app/(post)/components/p";
import { H1 as h1 } from "app/(post)/components/h1";
import { H2 as h2 } from "app/(post)/components/h2";
import { H3 as h3 } from "app/(post)/components/h3";
import { OL as ol } from "app/(post)/components/ol";
import { UL as ul } from "app/(post)/components/ul";
import { LI as li } from "app/(post)/components/li";
import { HR as hr } from "app/(post)/components/hr";
import { Code as code } from "app/(post)/components/code";
import { Tweet } from "app/(post)/components/tweet";
import { Image } from "app/(post)/components/image";
import { Figure } from "app/(post)/components/figure";
import { Snippet } from "app/(post)/components/snippet";
import { Caption } from "app/(post)/components/caption";
import { Callout } from "app/(post)/components/callout";
import { YouTube } from "app/(post)/components/youtube";
import { Ref, FootNotes, FootNote } from "app/(post)/components/footnotes";
import { Blockquote as blockquote } from "app/(post)/components/blockquote";
import { ThreeScene } from "@/app/(post)/components/three-sense";
import { Steps, Step } from "app/(post)/components/steps";
import { Tabs, Tab } from "app/(post)/components/tabs";
import { PullQuote } from "app/(post)/components/pull-quote";
import { Gallery } from "app/(post)/components/gallery";
import { Stats, Stat } from "app/(post)/components/stats";
import { Table, THead, TBody, TR, TH, TD } from "app/(post)/components/table";
import { Compare } from "app/(post)/components/compare";
import { Timeline, TimelineItem } from "app/(post)/components/timeline";
import { Accordion, AccordionItem } from "app/(post)/components/accordion";
import { KeyValueList, KeyValueItem } from "app/(post)/components/key-value";
import { VideoPlayer } from "app/(post)/components/video-player";
import { AudioPlayer } from "app/(post)/components/audio-player";
import { ImageGrid } from "app/(post)/components/image-grid";
import { Playground } from "app/(post)/components/playground";
import { StepPanel } from "app/(post)/components/step-panel";
import { Diff } from "app/(post)/components/diff";
import { StatGrid, KPI } from "app/(post)/components/stat-grid";
import { QuoteCard } from "app/(post)/components/quote-card";
import { InlineMath, MathBlock, EquationRef } from "app/(post)/components/math";
import { PaperCard } from "app/(post)/components/paper-card";
import {
  Citation,
  Bibliography,
  BibliographyItem,
} from "app/(post)/components/citation";
import { Chart } from "app/(post)/components/chart";
import { AblationTable } from "app/(post)/components/ablation-table";
import { TheoremBlock } from "app/(post)/components/theorem-block";
import { MermaidDiagram } from "app/(post)/components/mermaid-diagram";
import { ArchitectureDiagram } from "app/(post)/components/architecture-diagram";
import { FileTree } from "app/(post)/components/file-tree";
import { TerminalBlock } from "app/(post)/components/terminal-block";
import { BacktestChart } from "app/(post)/components/backtest-chart";
import { ProofBlock } from "app/(post)/components/proof-block";
import { DerivationBlock } from "app/(post)/components/derivation-block";
import { EquationGroup } from "app/(post)/components/equation-group";
import { AutoEquationRef } from "app/(post)/components/auto-equation-ref";
import { TaskSpecCard } from "app/(post)/components/task-spec-card";
import { ExperimentSetup } from "app/(post)/components/experiment-setup";
import { Heatmap } from "app/(post)/components/heatmap";
import { ConfusionMatrix } from "app/(post)/components/confusion-matrix";
import { MultiPanelFigure } from "app/(post)/components/multi-panel-figure";
import { KSpaceViewer } from "app/(post)/components/kspace-viewer";
import { MetricTable } from "app/(post)/components/metric-table";
import { LeaderboardTable } from "app/(post)/components/leaderboard-table";

export function useMDXComponents(components: {
  [component: string]: React.ComponentType;
}) {
  return {
    ...components,
    // Base HTML tags plus matching uppercase aliases for hand-written MDX.
    a,
    A: a,
    p,
    P: p,
    h1,
    H1: h1,
    h2,
    H2: h2,
    h3,
    H3: h3,
    ol,
    OL: ol,
    ul,
    UL: ul,
    li,
    LI: li,
    hr,
    HR: hr,
    code,
    Code: code,
    pre: Snippet,
    img: Image,
    blockquote,
    Tweet,
    Image,
    Figure,
    Snippet,
    Caption,
    Callout,
    YouTube,
    Ref,
    FootNotes,
    FootNote,
    ThreeScene,
    Steps,
    Step,
    Tabs,
    Tab,
    PullQuote,
    Gallery,
    Stats,
    Stat,
    Compare,
    Timeline,
    TimelineItem,
    Accordion,
    AccordionItem,
    KeyValueList,
    KeyValueItem,
    VideoPlayer,
    AudioPlayer,
    ImageGrid,
    Playground,
    StepPanel,
    Diff,
    StatGrid,
    KPI,
    QuoteCard,
    InlineMath,
    MathBlock,
    EquationRef,
    PaperCard,
    Citation,
    Bibliography,
    BibliographyItem,
    Chart,
    AblationTable,
    TheoremBlock,
    MermaidDiagram,
    ArchitectureDiagram,
    FileTree,
    TerminalBlock,
    BacktestChart,
    ProofBlock,
    DerivationBlock,
    EquationGroup,
    AutoEquationRef,
    TaskSpecCard,
    ExperimentSetup,
    Heatmap,
    ConfusionMatrix,
    MultiPanelFigure,
    KSpaceViewer,
    MetricTable,
    LeaderboardTable,
    Table,
    THead,
    TBody,
    TR,
    TH,
    TD,
  };
}
