import { NotFound } from "@feathersjs/errors";
import {
  Id,
  NullableId,
  Paginated,
  Params,
  ServiceAddons,
  ServiceMethods,
} from "@feathersjs/feathers";
import Echo, { Channel } from "laravel-echo";
import Pusher, { Options } from "pusher-js";

import MediaAdapter from "../../clients/intusAPI/adapters/media-adapter";
import PostAdapter from "../../clients/intusAPI/adapters/post-adapter";
import intusAPI, {
  AvailableNotifications,
  ClientRequestError,
  Notification,
  PostCreatedNotification,
  PostDeletedNotification,
} from "../../clients/intusAPI/intusAPI";
import { Media, Post } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Medias } from "../../services/medias/medias.class";
import { Posts } from "../posts/posts.class";
import { PostsSync } from "../posts-sync/posts-sync.class";
import { ShowcaseChecker } from "../showcase-checker/showcase-checker.class";

type Data = {
  server: "up" | "down";
  channelsConnected: boolean;
};

interface ServiceOptions {}

export class ServerStatusChecker implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;
  public status: Data = { server: "up", channelsConnected: false };

  private requestTimeout: number;
  private showcaseCheckerService: ShowcaseChecker & ServiceAddons<any>;
  private postsSyncService: PostsSync;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;

    this.requestTimeout = this.app.get("serverCheckTimeout");
    this.showcaseCheckerService = this.app.service("showcase-checker");
    this.postsSyncService = this.app.service("posts-sync");
  }

  start() {
    console.log("[ STARTING SERVER STATUS CHECKER ]");

    setInterval(async () => {
      try {
        console.log("[ CHECKING SERVER STATUS ]");
        await this.check();
        console.log("[ SERVER STATUS: UP ]");

        // If server status was already up, do nothing
        if (this.status.server === "up") return;

        await this.patch(null, { ...this.status, server: "up" });
        await this.connectToChannels();
        await this.postsSyncService.create({});
      } catch (e) {
        if (e instanceof ClientRequestError) {
          console.log("[ SERVER STATUS: DOWN ]");

          // If server status was already down, do nothing
          if (this.status.server === "down") return;

          await this.patch(null, { ...this.status, server: "down" });
        }
      }
    }, this.requestTimeout);
  }

  public async check() {
    return await intusAPI.checkServerStatus();
  }

  public async connectToChannels() {
    // Channels could already be connected, if when starting there was internet connection and server was up.
    // Only won't be connected to the channels if when the system started, there was no connection to the server.
    if (this.status.channelsConnected) return;

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

    await this.patch(null, { ...this.status, channelsConnected: true });
  }

  private async handlePostCreate(notification: PostCreatedNotification) {
    const showcaseChecker: ShowcaseChecker = this.app.service("showcase-checker");
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

    const converted = PostAdapter.fromAPIToLocal(postApi);
    await postsService.create({
      ...converted,
      showing: showcaseChecker.shouldShow(converted),
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find(params?: Params): Promise<Data[] | Paginated<Data>> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(id: Id, params?: Params): Promise<Data> {
    return this.status;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async patch(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return (this.status = data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove(id: NullableId, params?: Params): Promise<Data> {
    return this.status;
  }
}
