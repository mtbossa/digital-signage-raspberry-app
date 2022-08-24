import { Params, ServiceMethods } from "@feathersjs/feathers";

import intusAPI, { Media, Post as APIPost } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { MediaPosts } from "../media-posts/media-posts.class";

interface Data {}

interface ServiceOptions {}

export class PostsSync implements Pick<ServiceMethods<Data>, "create"> {
  app: Application;
  options: ServiceOptions;

  mediasPostsService: MediaPosts;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;

    this.mediasPostsService = this.app.service("media-posts");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: Data, params?: Params): Promise<Data> {
    console.log("[ SYNCING POSTS ]");

    try {
      const posts: APIPost[] = await intusAPI.fetchRaspberryPosts();
      const medias: Media[] = posts.map((post) => post.media);

      const mediasFiltered: Media[] = this.removeDuplicateMedias(medias);

      const mediasFilteredWithPosts = mediasFiltered.map((media: Media) => {
        const postsFromThisMedia = posts.filter((post) => post.media.id === media.id);

        return {
          ...media,
          posts: postsFromThisMedia,
        };
      });

      // TODO filter response and log the rejected ones
      const res = await Promise.allSettled(
        mediasFilteredWithPosts.map(async (media) => {
          return this.mediasPostsService.create(media);
        })
      );
    } catch (e) {
      console.log("[ SYNC FINISH WITH ERROR ]");

      this.app.service("posts").emit("sync-finish", { status: "finish" });

      throw e;
    }

    console.log("[ SYNC FINISH ]");

    this.app.service("posts").emit("sync-finish", { status: "finish" });

    return {};
  }

  private removeDuplicateMedias(medias: Media[]): Media[] {
    return medias.filter(
      (media: Media, index, self) =>
        index === self.findIndex((t: Media) => t.id === media.id)
    );
  }
}