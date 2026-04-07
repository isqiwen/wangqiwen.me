import { AboutPage, buildAboutMetadata } from "../about-page";

export const metadata = buildAboutMetadata("en");

export default function AboutEnPage() {
  return <AboutPage locale="en" />;
}
