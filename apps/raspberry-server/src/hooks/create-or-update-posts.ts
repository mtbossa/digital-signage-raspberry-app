// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { NotFound } from "@feathersjs/errors";
import { Hook, HookContext } from "@feathersjs/feathers";
import PostAdapter from "../clients/intusAPI/adapters/post-adapter";
import { Post } from "../clients/intusAPI/intusAPI";
import { Data as MediaData } from "../services/medias/medias.class";
import { Posts } from "../services/posts/posts.class";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const postsService: Posts = context.app.service("posts");
    const media: MediaData = context.data;
    const posts: Post[] = media.posts;

    const res = await Promise.allSettled(
      posts.map(async (post: Post) => {
        try {
          const foundPost = await postsService.get(post.id);
          return postsService.update(foundPost._id, {
            ...PostAdapter.fromAPIToLocal(post),
          });
        } catch (e) {
          if (e instanceof NotFound) {
            return postsService.create({
              ...PostAdapter.fromAPIToLocal(post),
            });
          }
        }
      })
    );

    return context;
  };
};
