import {
  Component,
  createEffect,
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import client, { port } from "./feathers";

import Loading from "./components/Loading";
import NoPost from "./components/NoPost/NoPost";

export interface Post {
  _id: number;
  exposeTime?: number;
  media: Media;
}

export interface Media {
  _id: number;
  path: string;
  type: "image" | "video";
}

const postsService = client.service("posts");

const findPlayingPostIndex = (playingPostId: number, currentPosts: Post[]) => {
  return currentPosts.findIndex((post) => post._id === playingPostId);
};

const isPostAlreadyInCarousel = (newPost: Post, carousel: Post[]) => {
  return carousel.find((post) => post._id === newPost._id);
};

const App: Component = () => {
  const [loading, setLoading] = createSignal(true);
  const [newPosts, setNewPosts] = createSignal<Post[]>([]);
  const [deletedPosts, setDeletedPosts] = createSignal<Pick<Post, "_id">[]>([]);
  const [playingPost, setPlayingPost] = createSignal<Post | null>(null, {
    equals: false,
  });
  const [carousel, setCarousel] = createSignal<Post[]>([]);
  let videoRef: HTMLVideoElement;

  onMount(() => {
    postsService.on("sync-finish", (data: { status: "finish" | "failed" }) => {
      setLoading(false);
    });

    postsService.on("start-post", (newPost: Post) => {
      if (isPostAlreadyInCarousel(newPost, carousel())) return;

      setNewPosts((newPosts) => {
        const newPostIndex = newPosts.findIndex(
          (currentPost) => currentPost._id === newPost._id
        );

        const postNotHere = newPostIndex === -1;

        if (postNotHere) {
          return [...newPosts!, newPost];
        }

        return newPosts;
      });
    });

    postsService.on("end-post", (removedPost: Pick<Post, "_id">) => {
      setDeletedPosts((currentDeletablePosts) => {
        return [...new Set([...currentDeletablePosts, removedPost])];
      });
    });
  });

  createEffect(() => {
    const carouselIsEmpty = carousel().length === 0;
    if (hasNewPosts() && carouselIsEmpty) {
      setCarousel(newPosts());
      setPlayingPost(carousel()[0]);
      setNewPosts([]);
    }
  });

  createEffect(() => {
    if (playingPost()?.media.type === "image") {
      setTimeout(() => handleNextPost(), playingPost()?.exposeTime);
    } else if (playingPost()?.media.type === "video") {
      videoRef.play();
    }
  });

  function handleNextPost() {
    let updatedCarousel: Post[] = carousel();

    if (hasNewPosts()) {
      updatedCarousel = addNewPostsToCarousel();
      setNewPosts([]);
    }

    if (hasPostsToDeleted()) {
      updatedCarousel = removeDeletedPostsFromCarousel(updatedCarousel);
      setDeletedPosts([]);
    }

    const playingPostIndex = findPlayingPostIndex(playingPost()!._id, carousel());
    setCarousel(updatedCarousel);
    const nextPost = carousel()[playingPostIndex + 1];
    // nextPost will be null when the playingPost is the last inside de carousel()
    setPlayingPost(nextPost ?? carousel()[0]);
  }

  function hasNewPosts() {
    return newPosts().length > 0;
  }

  function hasPostsToDeleted() {
    return deletedPosts().length > 0;
  }

  function addNewPostsToCarousel() {
    return [...carousel(), ...newPosts()];
  }

  function removeDeletedPostsFromCarousel(currentUpdatedCarousel: Post[]) {
    const remainingPosts = currentUpdatedCarousel.filter(
      (post) => !deletedPosts().find((deletedPost) => deletedPost._id === post._id)
    );
    return remainingPosts;
  }

  return (
    <>
      <Show when={!loading()} fallback={<Loading />}>
        <Show when={carousel().length > 0} fallback={<NoPost />}>
          <Switch fallback={<NoPost />}>
            <Match when={playingPost()?.media.type === "image"}>
              <img
                src={`http://localhost:${port}/medias/${playingPost()?.media.path}`}
                crossOrigin="anonymous"
              />
            </Match>
            <Match when={playingPost()?.media.type === "video"}>
              <video
                src={`http://localhost:${port}/medias/${playingPost()?.media.path}`}
                ref={videoRef!}
                muted
                autoplay
                onEnded={() => handleNextPost()}
                crossOrigin="anonymous"
              ></video>
            </Match>
          </Switch>
        </Show>
      </Show>
    </>
  );
};

export default App;
