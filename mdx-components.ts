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

export function useMDXComponents(components: {
  [component: string]: React.ComponentType;
}) {
  return {
    ...components,
    a,
    h1,
    h2,
    h3,
    p,
    ol,
    ul,
    li,
    hr,
    code,
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
    table: Table,
    thead: THead,
    tbody: TBody,
    tr: TR,
    th: TH,
    td: TD,
  };
}
