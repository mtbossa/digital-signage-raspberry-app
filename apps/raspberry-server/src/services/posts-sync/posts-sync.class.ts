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

interface Data {
  synced: boolean;
}

interface ServiceOptions {}

export class PostsSync implements Pick<ServiceMethods<Data>, "create"> {
  app: Application;
  options: ServiceOptions;
  status: Data = { synced: false };

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
    console.log("[ SYNCING POSTS ]");
    this.status = data;

    try {
      await this.syncPosts();
      await this.syncExpiredPosts();

      this.status = { synced: true };
    } catch (e) {
      console.log("[ SYNC FINISH WITH ERROR ]");

      this.postsService.emit("sync-finish", { status: "finish" });

      throw e;
    }

    console.log("[ SYNC FINISH ]");

    this.postsService.emit("sync-finish", { status: "finish" });

    return this.status;
  }

  private async syncExpiredPosts() {
    const expiredPosts: PostExpired[] = await intusAPI.fetchExpiredPosts();
    const deletableMediasIds = new Set(
      expiredPosts.filter((post) => post.canDeleteMedia).map((post) => post.media_id)
    );

    await Promise.allSettled(
      [...deletableMediasIds].map((mediaId: number) => this.mediasService.remove(mediaId))
    );
    await Promise.allSettled(
      expiredPosts.map((post) => this.postsService.remove(post.post_id))
    );
  }

  private async syncPosts() {
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

    await this.removeUndeletedPosts(posts);
  }

  private async removeUndeletedPosts(notExpiredPosts: APIPost[]) {
    // Since notExpiredPosts are all the posts that need to be shown
    // we can delete all the others that were not returned from the API
    const currentLocalPosts = (await this.postsService.find({
      paginate: false,
    })) as Post[];
    const undeletedPosts = currentLocalPosts.filter(
      (localPost) => notExpiredPosts.findIndex((post) => post.id === localPost._id) < 0
    );

    const neededMediasIds = [...new Set(notExpiredPosts.map((post) => post.media.id))];

    const deletableMediasIds = undeletedPosts
      .filter((post) => neededMediasIds.indexOf(post.mediaId) < 0)
      .map((post) => post.mediaId);

    await Promise.allSettled(
      deletableMediasIds.map((mediaId) => this.mediasService.remove(mediaId))
    );
    await Promise.allSettled(
      undeletedPosts.map((post) => this.postsService.remove(post._id))
    );
  }

  private removeDuplicateMedias(medias: Media[]): Media[] {
    return medias.filter(
      (media: Media, index, self) =>
        index === self.findIndex((t: Media) => t.id === media.id)
    );
  }
}
