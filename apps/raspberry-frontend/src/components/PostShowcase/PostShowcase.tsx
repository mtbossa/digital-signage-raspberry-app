import { useEffect, useRef, useState } from "react";
import { PostFrontendEvent } from "@intus/raspberry-server/src/channels";
import Image from "../Image";
import Loading from "../Loading";
import NoPost from "../NoPost";
import Video from "../Video";
import "./PostShowcase.css";

interface PostShowcaseProps {
  latestPosts: PostFrontendEvent[];
  updatePosts: (filteredPosts: PostFrontendEvent[]) => void;
  clearDeletablePosts: () => void;
  deletablePosts: PostFrontendEvent[];
  displayWidth: number;
  displayHeight: number;
  isLoading: boolean;
}

export default function PostShowcase({
  latestPosts,
  deletablePosts,
  updatePosts,
  clearDeletablePosts,
  displayWidth,
  displayHeight,
  isLoading,
}: PostShowcaseProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Controls when a post starts playing and stops, so can delete posts when not playing.
  // Triggers useEffect that will delete posts.
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Current post being showed on the screen
  const [showingPost, setShowingPost] = useState<PostFrontendEvent | null>(null);

  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!showingPost || Object.keys(showingPost).length === 0) return;

    console.log("showingPost: ", showingPost);
    console.log("index: ", currentPostIndex);

    setIsPlaying(true);
    if (showingPost?.media.type === "image") {
      setTimeout(() => {
        setIsPlaying(false);
      }, showingPost.exposeTime);
    } else {
      videoRef.current?.play();
    }
  }, [showingPost]);

  useEffect(() => {
    if (!isPlaying) {
      if (deletablePosts.length > 0) {
        const postsWithoutDeleted = latestPosts.filter((post) => {
          return deletablePosts.find(
            (deletedPost: PostFrontendEvent) => post._id !== deletedPost._id
          );
        });
        updatePosts(postsWithoutDeleted);
        clearDeletablePosts();
      }

      if (latestPosts.length > 0) {
        setShowingPost({ ...getNextPost(showingPost) });
      }
    }
  }, [isPlaying, latestPosts]);

  function handleOnVideoEnded(event: React.SyntheticEvent<HTMLVideoElement, Event>) {
    setIsPlaying(false);
  }

  function getNextPost(post: PostFrontendEvent | null): PostFrontendEvent {
    if (!post) {
      return latestPosts[0];
    }

    const nextIndex = currentPostIndex + 1;
    const nextPost = latestPosts[nextIndex];

    if (nextPost) {
      setCurrentPostIndex(nextIndex);
      return nextPost;
    } else {
      setCurrentPostIndex(0);
      return latestPosts[0];
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  if (latestPosts.length === 0) {
    return <NoPost />;
  }

  if (!showingPost) {
    return <Loading />;
  }

  if (showingPost.media.type === "image") {
    return <Image showingPost={showingPost} />;
  }

  return (
    <Video ref={videoRef} showingPost={showingPost} onVideoEnded={handleOnVideoEnded} />
  );
}
