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

const App: Component = () => {
  const [loading, setLoading] = createSignal(true);
  const [newPosts, setNewPosts] = createSignal<Post[]>([]);
  const [deletedPosts, setDeletedPosts] = createSignal<Pick<Post, "_id">[]>([]);
  const [playingPost, setPlayingPost] = createSignal<Post | null>(null, {
    equals: false,
  });
  const [carrousel, setCarrousel] = createSignal<Post[]>([]);
  let videoRef: HTMLVideoElement;

  onMount(() => {
    postsService.on("sync-finish", (data: { status: "finish" | "failed" }) => {
      setLoading(false);
    });

    postsService.on("start-post", (post: Post) => {
      setNewPosts((newPosts) => {
        const newPostIndex = newPosts.findIndex(
          (currentPost) => currentPost._id === post._id
        );

        const postNotHere = newPostIndex === -1;

        if (postNotHere) {
          return [...newPosts!, post];
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
    const carrouselIsEmpty = carrousel().length === 0;
    if (hasNewPosts() && carrouselIsEmpty) {
      setCarrousel(newPosts());
      setPlayingPost(carrousel()[0]);
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
    let updatedCarrousel: Post[] = carrousel();

    if (hasNewPosts()) {
      updatedCarrousel = addNewPostsToCarrousel();
      setNewPosts([]);
    }

    if (hasPostsToDeleted()) {
      updatedCarrousel = removeDeletedPostsFromCarrousel(updatedCarrousel);
      setDeletedPosts([]);
    }

    const playingPostIndex = findPlayingPostIndex(playingPost()!._id, carrousel());
    setCarrousel(updatedCarrousel);
    const nextPost = carrousel()[playingPostIndex + 1];
    // nextPost will be null when the playingPost is the last inside de carrousel()
    setPlayingPost(nextPost ?? carrousel()[0]);
  }

  function hasNewPosts() {
    return newPosts().length > 0;
  }

  function hasPostsToDeleted() {
    return deletedPosts().length > 0;
  }

  function addNewPostsToCarrousel() {
    return [...carrousel(), ...newPosts()];
  }

  function removeDeletedPostsFromCarrousel(currentUpdatedCarrousel: Post[]) {
    const remainingPosts = currentUpdatedCarrousel.filter(
      (post) => !deletedPosts().find((deletedPost) => deletedPost._id === post._id)
    );
    return remainingPosts;
  }

  return (
    <>
      <Show when={!loading()} fallback={<Loading />}>
        <Show when={carrousel().length > 0} fallback={<NoPost />}>
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
