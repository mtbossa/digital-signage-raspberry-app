import "./global.css";

import { ServiceAddons } from "@feathersjs/feathers";
import { PostFrontendEvent } from "@intus/raspberry-server/src/channels";
import { DisplayConnect } from "@intus/raspberry-server/src/services/display-connect/display-connect.class";
import { Posts } from "@intus/raspberry-server/src/services/posts/posts.class";
import { useCallback, useEffect, useState } from "react";

import PostShowcase from "./components/PostShowcase";
import client from "./feathers";

const postsService: Posts & ServiceAddons<Posts> = client.service("posts");
const displayConnectService: DisplayConnect & ServiceAddons<Posts> =
  client.service("display-connect");

// Path will always be /displays/1..2..n
const getDisplayIdFromUrlPath = (pathname: string): number => {
  const afterLastSlash = pathname.split("/")[2];

  return Number(afterLastSlash);
};

const updateDisplayPost = async (
  post: PostFrontendEvent,
  updatedValues: { showing?: boolean }
) => {
  const postDb = await postsService.get(post._id);

  const updatedDisplays = postDb.displays.map(
    (display: { _id: number; showing: boolean }) => {
      if (display._id !== post.currentDisplayId) return display;

      return { ...display, ...updatedValues };
    }
  );

  await postsService.patch(postDb._id, {
    ...postDb,
    displays: updatedDisplays,
  });
};

function App() {
  const [deletablePosts, setDeletablePosts] = useState<PostFrontendEvent[]>([]);
  const [currentPosts, setCurrentPosts] = useState<PostFrontendEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setupWebSocket = useCallback(async () => {
    displayConnectService.create({
      displayId: getDisplayIdFromUrlPath(window.location.pathname),
    });

    postsService.on("sync-finish", (data: { status: "finish" | "failed" }) => {
      setIsLoading(false);
    });

    postsService.on("start-post", async (post: PostFrontendEvent) => {
      setIsLoading(false);
      setCurrentPosts((currentPosts) => {
        return [...currentPosts!, post];
      });
      updateDisplayPost(post, {
        showing: true,
      });
    });

    postsService.on("end-post", async (removedPost: PostFrontendEvent) => {
      setIsLoading(false);
      setDeletablePosts((currentDeletablePosts) => {
        return [...currentDeletablePosts, removedPost];
      });
      updateDisplayPost(removedPost, {
        showing: false,
      });
    });
  }, []);

  useEffect(() => {
    setupWebSocket();
  }, [setupWebSocket]);

  const updatePosts = useCallback((updatedPosts: PostFrontendEvent[]) => {
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
