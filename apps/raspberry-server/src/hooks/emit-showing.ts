// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext, ServiceAddons } from "@feathersjs/feathers";

import logger from "../logger";
import { Media } from "../models/medias.model";
import { Post } from "../models/posts.model";
import { Medias } from "../services/medias/medias.class";
import { Posts } from "../services/posts/posts.class";

// Emits showing after media is downloaded
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const postsService: Posts & ServiceAddons<any> = context.app.service("posts");

    if (context.method === "remove") {
      const post: Post = context.result;
      if (post.showing) {
        logger.info(`Post removed, emitting end-post: ${post._id}`);
        postsService.emit("end-post", {
          _id: post._id,
        });
      }
      return context;
    }

    return context;
  };
};
