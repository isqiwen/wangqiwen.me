import { AboutPage, buildAboutMetadata } from "./about-page";

export const metadata = buildAboutMetadata();

export default function AboutRoutePage() {
  return <AboutPage />;
}
