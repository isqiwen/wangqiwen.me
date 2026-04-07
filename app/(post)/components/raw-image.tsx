/* eslint-disable @next/next/no-img-element */

import type { ImgHTMLAttributes } from "react";

type RawImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  alt: string;
};

export function RawImage({
  alt,
  loading = "lazy",
  decoding = "async",
  ...props
}: RawImageProps) {
  return <img alt={alt} loading={loading} decoding={decoding} {...props} />;
}
