import { AboutPage, buildAboutMetadata } from "../about-page";

export const metadata = buildAboutMetadata("zh");

export default function AboutZhPage() {
  return <AboutPage locale="zh" />;
}
