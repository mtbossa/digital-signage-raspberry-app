import { PostFrontendEvent } from "@intus/raspberry-server/src/channels";

import { appUrl } from "../../feathers";

interface ImageProps {
  showingPost: PostFrontendEvent;
}

export default function Image({ showingPost }: ImageProps) {
  /* eslint-disable jsx-a11y/alt-text */
  return (
    <img src={`${appUrl}/medias/${showingPost.media.path}`} crossOrigin="anonymous" />
  );
}
