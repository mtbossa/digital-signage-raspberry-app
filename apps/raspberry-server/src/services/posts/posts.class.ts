import { NotFound } from "@feathersjs/errors";
import { Params } from "@feathersjs/feathers";
import { Service, MongooseServiceOptions } from "feathers-mongoose";
import MediaAdapter from "../../clients/intusAPI/adapters/media-adapter";
import {
  IntusAPI,
  Media,
  Post as APIPost,
} from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Post } from "../../models/posts.model";
import { Medias } from "../medias/medias.class";

// A type interface for our user (it does not validate any data)
export class Posts extends Service<Post> {
  private mediasService: Medias;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(
    options: Partial<MongooseServiceOptions>,
    private app: Application,
    private intusAPI: IntusAPI = new IntusAPI()
  ) {
    super(options);

    this.mediasService = this.app.service("medias");
  }

  private removeDuplicateMedias(medias: Media[]): Media[] {
    return medias.filter(
      (media: Media, index, self) =>
        index === self.findIndex((t: Media) => t.id === media.id)
    );
  }

  public async sync(displayId: number) {
    console.log("[ SYNCING POSTS ]");

    try {
      const posts: APIPost[] = await this.intusAPI.fetchRaspberryPosts();
      const medias: Media[] = posts.map((post) => post.media);

      const mediasFiltered: Media[] = this.removeDuplicateMedias(medias);

      const mediasFilteredWithPosts = mediasFiltered.map((media: Media) => {
        const postsFromThisMedia = posts.filter(
          (post) => post.media.id === media.id
        );

        return {
          ...media,
          posts: postsFromThisMedia,
        };
      });

      // TODO filter response and log the rejected ones
      const res = await Promise.allSettled(
        mediasFilteredWithPosts.map(async (media) => {
          // Checks if media already exists, if doesn't, will throw error NotFound and we'll create it.
          // Otherwise, update it so can create any new posts.
          try {
            const foundMedia = await this.mediasService.get(media.id);
            return this.mediasService.update(foundMedia._id, {
              ...foundMedia,
              posts: media.posts,
            });
          } catch (e) {
            if (e instanceof NotFound) {
              return this.mediasService.create({
                ...MediaAdapter.fromAPIToLocal(media),
                posts: media.posts,
              });
            }
          }
        })
      );
    } catch (e) {
      console.log("[ SYNC FINISH WITH ERROR ]");

      this.app.service("posts").emit("sync-finish", { status: "finish" });

      throw e;
    }

    console.log("[ SYNC FINISH ]");

    this.app.service("posts").emit("sync-finish", { status: "finish" });
  }
}
