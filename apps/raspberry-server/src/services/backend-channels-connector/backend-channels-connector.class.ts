import { NotFound } from "@feathersjs/errors";
import { Id, NullableId, Paginated, Params, ServiceMethods } from "@feathersjs/feathers";
import Echo, { Channel } from "laravel-echo";
import Pusher, { Options } from "pusher-js";

import MediaAdapter from "../../clients/intusAPI/adapters/media-adapter";
import PostAdapter from "../../clients/intusAPI/adapters/post-adapter";
import {
  AvailableNotifications,
  Media,
  Notification,
  Post,
  PostCreatedNotification,
  PostDeletedNotification,
  PostUpdatedNotification,
} from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import logger from "../../logger";
import { Medias } from "../medias/medias.class";
import { Posts } from "../posts/posts.class";

interface Data {}

interface ServiceOptions {}

export class BackendChannelsConnector implements Pick<ServiceMethods<Data>, "create"> {
  app: Application;
  options: ServiceOptions;
  status = { channelsConnected: false };

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: Data, params?: Params): Promise<Data> {
    // Channels could already be connected, if when starting there was internet connection and server was up.
    // Only won't be connected to the channels if when the system started, there was no connection to the server.
    if (this.status.channelsConnected) return this.status;

    logger.info("Connecting to Laravel WebSocket channels");

    const authorizationToken: string = this.app.get("raspberryAPIToken");
    const apiUrl: string = this.app.get("apiUrl");
    const raspberryId: number = this.app.get("raspberryId");
    const pusherAppCluster: string = this.app.get("pusherAppCluster");
    const pusherAppKey: string = this.app.get("pusherAppKey");

    const options: Options = {
      authEndpoint: `${apiUrl}/api/broadcasting/auth`,
      forceTLS: true,
      cluster: pusherAppCluster,
      enabledTransports: ["ws", "wss"],
      auth: {
        headers: {
          Authorization: `Bearer ${authorizationToken}`,
        },
      },
    };

    const pusher: Pusher = new Pusher(pusherAppKey, options);

    const laravelEcho: Echo = new Echo({
      ...options,
      broadcaster: "pusher",
      key: pusherAppKey,
      client: pusher,
    });

    const channel: Channel = laravelEcho.private(`App.Models.Raspberry.${raspberryId}`);

    channel.notification(async (notification: Notification) => {
      switch (this.getEventName(notification.type)) {
        case "PostCreated":
          await this.handlePostCreate(notification as PostCreatedNotification);
          break;
        case "PostDeleted":
          await this.handlePostDeleted(notification as PostDeletedNotification);
          break;
        case "PostUpdated":
          await this.handlePostUpdated(notification as PostUpdatedNotification);
          break;
      }
    });

    this.status.channelsConnected = true;

    return this.status;
  }

  private async createPost(postApi: Post, mediaApi: Media) {
    const mediasService: Medias = this.app.service("medias");
    const postsService: Posts = this.app.service("posts");
    const showcaseChecker = this.app.service("showcase-checker");

    await mediasService.update(
      mediaApi.id,
      {
        ...MediaAdapter.fromAPIToLocal(mediaApi),
      },
      {
        nedb: { upsert: true },
      }
    );

    const newPost = await postsService.create({
      ...PostAdapter.fromAPIToLocal(postApi),
    });

    // Even thought we know newPost is not an Array, typescript
    // won't compile if we don't perform this check, since postsService.create()
    // could return an array for some reason
    if (!Array.isArray(newPost)) {
      await showcaseChecker.checkPost(newPost);
    }
  }

  private async handlePostCreate(notification: PostCreatedNotification) {
    const postApi = notification.post as Post; // Here we know we have post, since we control the data returned from the backend
    const mediaApi: Media = postApi.media;

    await this.createPost(postApi, mediaApi);
  }

  private async handlePostDeleted(notification: PostDeletedNotification) {
    const mediasService: Medias = this.app.service("medias");
    const postsService: Posts = this.app.service("posts");

    const { post_id, media_id, canDeleteMedia } = notification;

    // This post and media could already be deleted on startup, because the post could be expired,
    // and when the post is expired, we automatically delete it on post sync (and the media is possible)
    if (canDeleteMedia) {
      try {
        await mediasService.remove(media_id);
      } catch (e) {
        if (e instanceof NotFound) {
          logger.debug("[ handlePostDeleted() ] Media was already deleted on startup");
        }
      }
    }
    try {
      await postsService.remove(post_id);
    } catch (e) {
      if (e instanceof NotFound) {
        logger.debug("[ handlePostDeleted() ] Post was already deleted on startup");
      }
    }
  }

  // We don't need to worry about media here, because we can't update the posts media in the backend
  private async handlePostUpdated(notification: PostUpdatedNotification) {
    const postsService = this.app.service("posts");

    const { post: postApi } = notification;

    try {
      const postToUpdate = await postsService.get(postApi.id);

      // We always end-post if its showing, so next shouldShow call emits with the updated values.
      if (postToUpdate.showing) {
        postsService.emit("end-post", {
          _id: postApi.id,
        });
      }

      await postsService.update(postApi.id, {
        ...PostAdapter.fromAPIToLocal(postApi),
      });
    } catch (e) {
      logger.error(`Error while trying to update post: ${e}`);
      if (e instanceof NotFound) {
        this.createPost(postApi, postApi.media);
      }
    }
  }

  private getEventName(laravelEvent: string): AvailableNotifications {
    const afterLastSlash: AvailableNotifications = laravelEvent.substring(
      laravelEvent.lastIndexOf("\\") + 1
    ) as AvailableNotifications;

    return afterLastSlash;
  }
}
