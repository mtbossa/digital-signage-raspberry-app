import { Post } from "../../App";

interface ImageProps {
	showingPost: Post;
	displayWidth: number;
	displayHeight: number;
}

export default function Image({
	showingPost,
	displayWidth,
	displayHeight,
}: ImageProps) {
	/* eslint-disable jsx-a11y/alt-text */
	return (
		<img
			src={`http://localhost:3030/medias/${showingPost.media.path}`} 
			width={displayWidth}
			height={displayHeight}
			crossOrigin="anonymous"
		/>
	);
}
