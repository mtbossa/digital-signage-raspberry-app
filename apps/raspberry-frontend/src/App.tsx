import { useCallback, useEffect, useState } from "react";

import PostShowcase from "./components/PostShowcase";
import client from "./feathers";

import "./global.css";

export interface Post {
	_id: number;
	exposeTime?: number;
	media: Media;
}

export interface Media {
	_id: number;
	path: string;
	type: string;
}

const postsService = client.service("posts");
const displayConnectService = client.service("display-connect");

const getDisplayIdFromUrlPath = (pathname: string): number => {
	const afterLastSlash = pathname.substring(pathname.lastIndexOf("/") + 1);

	return Number(afterLastSlash);
};

function App() {
	const [deletablePosts, setDeletablePosts] = useState<Post[]>([]);
	const [currentPosts, setCurrentPosts] = useState<Post[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const setupWebSocket = useCallback(async () => {
		displayConnectService.create({
			displayId: getDisplayIdFromUrlPath(window.location.pathname),
		});

		postsService.on("sync-finish", (data: { status: "finish" | "failed" }) => {
			console.log("sync-finish");
			setIsLoading(false);
		});

		postsService.on("start-post", (post: Post) => {
			console.log("starting-post");
			setIsLoading(false);
			setCurrentPosts(currentPosts => {
				return [...currentPosts!, post];
			});
		});

		postsService.on("end-post", (removedPost: Post) => {
			setIsLoading(false);
			setDeletablePosts(currentDeletablePosts => {
				return [...currentDeletablePosts, removedPost];
			});
		});
	}, []);

	useEffect(() => {
		setupWebSocket();
	}, [setupWebSocket]);

	const updatePosts = useCallback((updatedPosts: Post[]) => {
		setCurrentPosts([...updatedPosts]);
	}, []);

	const clearDeletablePosts = useCallback(() => {
		setDeletablePosts([]);
	}, []);

	return (
		<div className="app">
			<PostShowcase
				latestPosts={currentPosts}
				deletablePosts={deletablePosts}
				updatePosts={updatePosts}
				clearDeletablePosts={clearDeletablePosts}
				isLoading={isLoading}
				displayWidth={1920}
				displayHeight={1080}
			/>
		</div>
	);
}

export default App;
