import React, { SyntheticEvent } from "react";
import { Post } from "../../App";

interface VideoProps {
	showingPost: Post;
	displayWidth: number;
	displayHeight: number;
	onVideoEnded: (event: SyntheticEvent<HTMLVideoElement, Event>) => void;
}

const Video: React.ForwardRefRenderFunction<HTMLVideoElement, VideoProps> = (
	{ showingPost, displayWidth, displayHeight, onVideoEnded },
	ref
) => {
	return (
		<video
			src={`http://localhost:3030/medias/${showingPost.media.path}`}
			ref={ref}
			muted
			autoPlay
			width={displayWidth}
			height={displayHeight}
			onEnded={onVideoEnded}
			crossOrigin="anonymous"
		></video>
	);
};

export default React.forwardRef(Video);
