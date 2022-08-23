import { Post } from "../../App";

interface ImageProps {
  showingPost: Post;
}

export default function Image({ showingPost }: ImageProps) {
  /* eslint-disable jsx-a11y/alt-text */
  return (
    <img
      src={`http://localhost:3030/medias/${showingPost.media.path}`}
      crossOrigin="anonymous"
    />
  );
}
