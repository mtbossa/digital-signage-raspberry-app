import { PostFrontendEvent } from "@intus/raspberry-server/src/channels";
import React, { SyntheticEvent } from "react";

import { appUrl } from "../../feathers";

interface VideoProps {
  showingPost: PostFrontendEvent;
  onVideoEnded: (event: SyntheticEvent<HTMLVideoElement, Event>) => void;
}

const Video: React.ForwardRefRenderFunction<HTMLVideoElement, VideoProps> = (
  { showingPost, onVideoEnded },
  ref
) => {
  return (
    <video
      src={`${appUrl}/medias/${showingPost.media.path}`}
      ref={ref}
      muted
      autoPlay
      onEnded={onVideoEnded}
      crossOrigin="anonymous"
    ></video>
  );
};

export default React.forwardRef(Video);
