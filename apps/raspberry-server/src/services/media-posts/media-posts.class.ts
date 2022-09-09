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
    const showcaseChecker = this.app.service("showcase-checker");

    await this.mediasService.update(
      media.id,
      {
        ...MediaAdapter.fromAPIToLocal(media),
      },
      {
        nedb: { upsert: true },
      }
    );

    const res = await Promise.allSettled(
      media.posts.map(async (post: Post) => {
        return this.postsService.update(
          post.id,
          {
            ...PostAdapter.fromAPIToLocal(post),
          },
          {
            nedb: { upsert: true },
          }
        );
      })
    );

    return media;
  }
}
