import "./PostShowcase.css";

import React, { useEffect, useRef, useState } from "react";

import { Post } from "../../App";
import Image from "../Image";
import Loading from "../Loading";
import NoPost from "../NoPost";
import Video from "../Video";

interface PostShowcaseProps {
  latestPosts: Post[];
  updatePosts: (filteredPosts: Post[]) => void;
  clearDeletablePosts: () => void;
  deletablePosts: Pick<Post, "_id">[];
  isLoading: boolean;
}

export default function PostShowcase({
  latestPosts,
  deletablePosts,
  updatePosts,
  clearDeletablePosts,
  isLoading,
}: PostShowcaseProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Current post being showed on the screen
  const [showingPost, setShowingPost] = useState<Post | null>(null);

  const [currentPostIndex, setCurrentPostIndex] = useState<number>(0);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (latestPosts.length === 0) return;

    if (!showingPost) {
      setShowingPost({ ...getNextPost(showingPost) });
      return;
    }

    if (showingPost?.media.type === "image") {
      setTimeout(() => {
        handleNextPost();
      }, showingPost.exposeTime);
    } else {
      videoRef.current?.play();
    }
  }, [showingPost, latestPosts]);

  function handleOnVideoEnded(event: React.SyntheticEvent<HTMLVideoElement, Event>) {
    handleNextPost();
  }

  function handleNextPost() {
    if (deletablePosts.length > 0) {
      const uniqueDeletablePosts = Array.from(new Set(deletablePosts));
      const remainingPosts = latestPosts.filter(
        (post) =>
          uniqueDeletablePosts.findIndex(
            (deletedPost) => post._id === deletedPost._id
          ) === -1
      );

      updatePosts(remainingPosts);

      if (remainingPosts.length === 0) {
        setShowingPost(null);
      }

      clearDeletablePosts();
    } else {
      if (latestPosts.length > 0) {
        setShowingPost({ ...getNextPost(showingPost) });
      }
    }
  }

  function getNextPost(post: Post | null): Post {
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
