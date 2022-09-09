import { Params, ServiceAddons, ServiceMethods } from "@feathersjs/feathers";

import intusAPI, {
  Media,
  Post as APIPost,
  PostExpired,
} from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Post } from "../../models/posts.model";
import { MediaPosts } from "../media-posts/media-posts.class";
import { Medias } from "../medias/medias.class";
import { Posts } from "../posts/posts.class";

interface Data {}

interface ServiceOptions {}

export class PostsSync implements Pick<ServiceMethods<Data>, "create"> {
  app: Application;
  options: ServiceOptions;
  status = { synced: false };

  mediasPostsService: MediaPosts & ServiceAddons<any>;
  postsService: Posts & ServiceAddons<any>;
  mediasService: Medias & ServiceAddons<any>;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;

    this.mediasPostsService = this.app.service("media-posts");
    this.postsService = this.app.service("posts");
    this.mediasService = this.app.service("medias");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: Data, params?: Params): Promise<Data> {
    const showcaseChecker = this.app.service("showcase-checker");

    console.log("[ SYNCING POSTS ]");
    try {
      await this.syncPosts();
      this.status = { synced: true };
    } catch (e) {
      console.log("[ SYNC FINISH WITH ERROR ]");
      this.postsService.emit("sync-finish", { status: "finish" });
      await showcaseChecker.checkPosts();

      throw e;
    }

    console.log("[ SYNC FINISH ]");
    this.postsService.emit("sync-finish", { status: "finish" });

    return this.status;
  }

  private async syncPosts() {
    const posts: APIPost[] = await intusAPI.fetchRaspberryPosts();
    const medias: Media[] = posts.map((post) => post.media);
    const showcaseChecker = this.app.service("showcase-checker");

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

    await this.removeUndeletedPosts(posts);
    await showcaseChecker.checkPosts();
  }

  private async removeUndeletedPosts(notExpiredPosts: APIPost[]) {
    // Since notExpiredPosts are all the posts that need to be shown
    // we can delete all the others that were not returned from the API
    const undeletedPosts = await this.findUndeletedPosts(notExpiredPosts);
    const deletableMediasIds = this.findDeletableMediasIds(
      notExpiredPosts,
      undeletedPosts
    );
    await Promise.allSettled(
      deletableMediasIds.map((mediaId) => this.mediasService.remove(mediaId))
    );
    await Promise.allSettled(
      undeletedPosts.map((post) => this.postsService.remove(post._id))
    );
  }

  private findDeletableMediasIds(notExpiredPosts: APIPost[], undeletedPosts: Post[]) {
    const neededMediasIds = [...new Set(notExpiredPosts.map((post) => post.media.id))];
    return [
      ...new Set(
        undeletedPosts
          .filter((post) => neededMediasIds.indexOf(post.mediaId) < 0)
          .map((post) => post.mediaId)
      ),
    ];
  }

  private async findUndeletedPosts(notExpiredPosts: APIPost[]) {
    const currentLocalPosts = (await this.postsService.find({
      paginate: false,
    })) as Post[];

    // Finds all the posts that are locally saved but didn't come on the response from
    // displays posts request
    return currentLocalPosts.filter(
      (localPost) => notExpiredPosts.findIndex((post) => post.id === localPost._id) < 0
    );
  }

  private removeDuplicateMedias(medias: Media[]): Media[] {
    return medias.filter(
      (media: Media, index, self) =>
        index === self.findIndex((t: Media) => t.id === media.id)
    );
  }
}
