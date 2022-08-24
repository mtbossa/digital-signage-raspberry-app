import { NotFound } from "@feathersjs/errors";
import { Id, NullableId, Paginated, Params, ServiceMethods } from "@feathersjs/feathers";

import MediaAdapter from "../../clients/intusAPI/adapters/media-adapter";
import PostAdapter from "../../clients/intusAPI/adapters/post-adapter";
import { Media, Post } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Medias } from "../medias/medias.class";
import { Posts } from "../posts/posts.class";

export interface Data extends Media {
  posts: Post[]; // Receives the posts so it can be passed along with the context, however, won't be saved in the database here
  downloaded?: boolean; // Makes it optional since we need to update its value when media finished downloading
}

interface ServiceOptions {}

export class MediaPosts implements Pick<ServiceMethods<Data>, "create"> {
  app: Application;
  options: ServiceOptions;

  private mediasService: Medias;
  private postsService: Posts;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;

    this.mediasService = this.app.service("medias");
    this.postsService = this.app.service("posts");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(media: Data, params?: Params): Promise<Data> {
    // Checks if media already exists, if doesn't, will throw error NotFound and we'll create it.
    try {
      const foundMedia = await this.mediasService.get(media.id);
      console.log("updating media");
      await this.mediasService.update(foundMedia._id, {
        ...foundMedia,
      });
    } catch (e) {
      if (e instanceof NotFound) {
        console.log("creating media");
        await this.mediasService.create({
          ...MediaAdapter.fromAPIToLocal(media),
        });
      }
    }

    const res = await Promise.allSettled(
      media.posts.map(async (post: Post) => {
        try {
          const foundPost = await this.postsService.get(post.id);
          console.log("updating post");
          return this.postsService.update(foundPost._id, {
            ...PostAdapter.fromAPIToLocal(post),
          });
        } catch (e) {
          if (e instanceof NotFound) {
            console.log("creating post");
            return this.postsService.create({
              ...PostAdapter.fromAPIToLocal(post),
            });
          }
        }
      })
    );

    return media;
  }
}
