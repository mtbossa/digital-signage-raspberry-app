import "./global.css";

import { useCallback, useEffect, useState } from "react";

import PostShowcase from "./components/PostShowcase";
import client from "./feathers";

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

function App() {
  const [deletablePosts, setDeletablePosts] = useState<Pick<Post, "_id">[]>([]);
  const [currentPosts, setCurrentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setupWebSocket = useCallback(() => {
    postsService.on("sync-finish", (data: { status: "finish" | "failed" }) => {
      setIsLoading(false);
    });

    postsService.on("start-post", (post: Post) => {
      setCurrentPosts((currentPosts) => {
        const postAlreadyHere = currentPosts.findIndex(
          (currentPost) => currentPost._id === post._id
        );

        if (postAlreadyHere === -1) {
          return [...currentPosts!, post];
        }

        return currentPosts;
      });
    });

    postsService.on("end-post", (removedPost: Pick<Post, "_id">) => {
      setDeletablePosts((currentDeletablePosts) => {
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
      />
    </div>
  );
}

export default App;
