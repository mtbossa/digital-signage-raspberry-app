import { Post } from "../../App";
import { port } from "../../feathers";

interface ImageProps {
  showingPost: Post;
}

export default function Image({ showingPost }: ImageProps) {
  /* eslint-disable jsx-a11y/alt-text */
  return (
    <img
      src={`http://localhost:${port}/medias/${showingPost.media.path}`}
      crossOrigin="anonymous"
    />
  );
}
