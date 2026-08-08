"use client";
import type { ComponentProps } from "react";
import YT from "react-youtube";

type YouTubeProps = ComponentProps<typeof YT> & {
  videoId: string;
};

export function YouTube({ videoId, ...props }: YouTubeProps) {
  return (
    <span className="block my-5">
      <YT
        {...props}
        videoId={videoId}
        className={`w-full ${props.className ?? ""}`.trim()}
        iframeClassName={`aspect-video w-full ${props.iframeClassName ?? ""}`.trim()}
      />
    </span>
  );
}
