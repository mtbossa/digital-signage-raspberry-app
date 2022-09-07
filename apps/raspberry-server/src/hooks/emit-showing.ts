// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext, ServiceAddons } from "@feathersjs/feathers";

import { Media } from "../models/medias.model";
import { Post } from "../models/posts.model";
import { Medias } from "../services/medias/medias.class";
import { Posts } from "../services/posts/posts.class";

// Emits showing after media is downloaded
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const mediasService: Medias = context.app.service("medias");
    const postsService: Posts & ServiceAddons<any> = context.app.service("posts");

    if (context.method === "remove") {
      const post: Post = context.result;
      postsService.emit("end-post", {
        _id: post._id,
      });
      return context;
    }

    const post: Post = context.data;
    const media: Media = await mediasService.get(post.mediaId); // Will always exists, because every Post has a Media, it's required

    // TODO do something if media is not downloaded, since it should be
    if (!media.downloaded) return context;

    if (post.showing) {
      postsService.emit("start-post", {
        _id: post._id,
        exposeTime: post.exposeTime,
        media,
      });
    } else if (post.showing === false && context.method !== "create") {
      // We must only send end-post event when it's an post update, since it's impossible
      // for a post to be running if it's a post being created, since it's not already created.
      // So we don't need to emit end-post, even if post.showing is false.
      postsService.emit("end-post", {
        _id: post._id,
        exposeTime: post.exposeTime,
        media,
      });
    }

    return context;
  };
};
