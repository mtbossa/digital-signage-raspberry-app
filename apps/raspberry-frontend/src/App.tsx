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
  const [deletablePosts, setDeletablePosts] = useState<Post[]>([]);
  const [currentPosts, setCurrentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setupWebSocket = useCallback(() => {
    postsService.on("sync-finish", (data: { status: "finish" | "failed" }) => {
      console.log("sync-finish");
      setIsLoading(false);
    });

    postsService.on("start-post", (post: Post) => {
      setCurrentPosts((currentPosts) => {
        return [...currentPosts!, post];
      });
    });

    postsService.on("end-post", (removedPost: Post) => {
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
