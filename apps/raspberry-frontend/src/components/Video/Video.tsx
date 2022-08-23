import React, { SyntheticEvent } from "react";

import { Post } from "../../App";

interface VideoProps {
  showingPost: Post;
  onVideoEnded: (event: SyntheticEvent<HTMLVideoElement, Event>) => void;
}

const Video: React.ForwardRefRenderFunction<HTMLVideoElement, VideoProps> = (
  { showingPost, onVideoEnded },
  ref
) => {
  return (
    <video
      src={`http://localhost:3030/medias/${showingPost.media.path}`}
      ref={ref}
      muted
      autoPlay
      onEnded={onVideoEnded}
      crossOrigin="anonymous"
    ></video>
  );
};

export default React.forwardRef(Video);
