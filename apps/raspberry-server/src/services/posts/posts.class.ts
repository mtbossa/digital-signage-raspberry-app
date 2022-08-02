import { NotFound } from "@feathersjs/errors";
import { MongooseServiceOptions, Service } from "feathers-mongoose";

import MediaAdapter from "../../clients/intusAPI/adapters/media-adapter";
import {
  ClientRequestError,
  IntusAPI,
  Media,
  Post as APIPost,
} from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Display } from "../../models/displays.model";
import { Post } from "../../models/posts.model";
import { Medias } from "../medias/medias.class";
import { ServerStatusChecker } from "../server-status-checker/server-status-checker.class";
import { ShowcaseChecker } from "../showcase-checker/showcase-checker.class";

export interface Data extends Post {
  currentDisplay: { _id: number; showing: boolean }; // Receives the posts so it can be passed along with the context, however, won't be saved in the database here
}

// A type interface for our user (it does not validate any data)
export class Posts extends Service<Data> {
  private mediasService: Medias;
  private showcaseChecker: ShowcaseChecker;
  private serverStatusCheckerService: ServerStatusChecker;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(
    options: Partial<MongooseServiceOptions>,
    private app: Application,
    private intusAPI: IntusAPI = new IntusAPI()
  ) {
    super(options);

    this.mediasService = this.app.service("medias");
    this.showcaseChecker = this.app.service("showcase-checker");
    this.serverStatusCheckerService = this.app.service("server-status-checker");
  }

  private removeDuplicateMedias(medias: Media[]): Media[] {
    return medias.filter(
      (media: Media, index, self) =>
        index === self.findIndex((t: Media) => t.id === media.id)
    );
  }

  public async sync(display: Display) {
    console.log(`[ SYNCING POSTS FROM DISPLAY ${display._id} ]`);

    try {
      const posts: APIPost[] = await this.intusAPI.fetchDisplayPosts(display._id);
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
      await Promise.allSettled(
        mediasFilteredWithPosts.map(async (media) => {
          // Checks if media already exists, if doesn't, will throw error NotFound and we'll create it.
          // Otherwise, update it so can create any new posts.
          try {
            const foundMedia = await this.mediasService.get(media.id);
            return this.mediasService.update(foundMedia._id, {
              ...foundMedia,
              posts: media.posts,
              display: display,
            });
          } catch (e) {
            if (e instanceof NotFound) {
              return this.mediasService.create({
                ...MediaAdapter.fromAPIToLocal(media),
                posts: media.posts,
                display: display,
              });
            }
          }
        })
      );
    } catch (e) {
      this.app.service("posts").emit("sync-finish", { status: "finish" });

      console.log(`[ SYNC POSTS FROM DISPLAY ${display._id} FINISH WITH ERROR ]`);
      console.error(`Error while syncing display ${display._id}: `, e);

      if (e instanceof ClientRequestError) {
        console.log(`[ SERVER DOWN WHILE SYNCING DISPLAY ${display._id}]`);

        await this.serverStatusCheckerService.patch(null, {
          ...this.serverStatusCheckerService.status,
          server: "down",
        });

        this.showcaseChecker.start();

        return;
      }

      throw e;
    }

    console.log(`[ SYNC POSTS FROM DISPLAY ${display._id} FINISH ]`);

    this.app.service("posts").emit("sync-finish", { status: "finish" });
  }
}
