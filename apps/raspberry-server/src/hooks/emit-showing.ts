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
    } else {
      postsService.emit("end-post", {
        _id: post._id,
        exposeTime: post.exposeTime,
        media,
      });
    }

    return context;
  };
};
