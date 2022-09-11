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
} from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
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

    console.log("[ CONNECTING TO LARAVEL CHANNELS ]");

    const authorizationToken: string = this.app.get("displayAPIToken");
    const apiUrl: string = this.app.get("apiUrl");
    const displayId: number = this.app.get("displayId");

    const options: Options = {
      authEndpoint: `${apiUrl}/api/broadcasting/auth`,
      forceTLS: true,
      cluster: "sa1",
      enabledTransports: ["ws", "wss"],
      auth: {
        headers: {
          Authorization: `Bearer ${authorizationToken}`,
        },
      },
    };

    const pusher: Pusher = new Pusher("67f6f5d1618646d3ea95", options);

    const laravelEcho: Echo = new Echo({
      ...options,
      broadcaster: "pusher",
      key: "67f6f5d1618646d3ea95",
      client: pusher,
      auth: {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${authorizationToken}`,
        },
      },
    });

    const channel: Channel = laravelEcho.private(`App.Models.Display.${displayId}`);

    channel.notification(async (notification: Notification) => {
      switch (this.getEventName(notification.type)) {
        case "PostCreated":
          await this.handlePostCreate(notification as PostCreatedNotification);
          break;
        case "PostDeleted":
          await this.handlePostDeleted(notification as PostDeletedNotification);
          break;
      }
    });

    this.status.channelsConnected = true;

    return this.status;
  }

  private async handlePostCreate(notification: PostCreatedNotification) {
    const mediasService: Medias = this.app.service("medias");
    const postsService: Posts = this.app.service("posts");

    const postApi = notification.post as Post; // Here we know we have post, since we control the data returned from the backend
    const mediaApi: Media = postApi.media;

    await mediasService.update(
      mediaApi.id,
      {
        ...MediaAdapter.fromAPIToLocal(mediaApi),
      },
      {
        nedb: { upsert: true },
      }
    );

    await postsService.create({
      ...PostAdapter.fromAPIToLocal(postApi),
    });
  }

  private async handlePostDeleted(notification: PostDeletedNotification) {
    const mediasService: Medias = this.app.service("medias");
    const postsService: Posts = this.app.service("posts");

    const { post_id, media_id, canDeleteMedia } = notification;

    if (canDeleteMedia) {
      await mediasService.remove(media_id);
    }

    await postsService.remove(post_id);
  }

  private getEventName(laravelEvent: string): AvailableNotifications {
    const afterLastSlash: AvailableNotifications = laravelEvent.substring(
      laravelEvent.lastIndexOf("\\") + 1
    ) as AvailableNotifications;

    return afterLastSlash;
  }
}
