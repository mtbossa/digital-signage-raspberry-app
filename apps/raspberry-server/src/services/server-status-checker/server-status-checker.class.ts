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
import intusAPI, { ClientRequestError } from "../../clients/intusAPI/intusAPI";
import { Media, Post } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Medias } from "../../services/medias/medias.class";
import { Posts } from "../posts/posts.class";
import { ShowcaseChecker } from "../showcase-checker/showcase-checker.class";

type Data = {
  server: "up" | "down";
  channelsConnected: boolean;
};

interface ServiceOptions {}

type AvailableNotifications = "PostStarted" | "PostEnded";
interface Notification {
  id: string;
  type: AvailableNotifications;
  [key: string]: any;
}

export class ServerStatusChecker implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;
  public status: Data = { server: "down", channelsConnected: false };

  private requestTimeout: number;
  private showcaseCheckerService: ShowcaseChecker & ServiceAddons<any>;
  private postsService: Posts & ServiceAddons<any>;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;

    this.requestTimeout = this.app.get("serverCheckTimeout");
    this.showcaseCheckerService = this.app.service("showcase-checker");
    this.postsService = this.app.service("posts");
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
        await this.showcaseCheckerService.stop();
        await this.connectToChannels();
        await this.postsService.sync();
      } catch (e) {
        if (e instanceof ClientRequestError) {
          console.log("[ SERVER STATUS: DOWN ]");

          // If server status was already down, do nothing
          if (this.status.server === "down") return;

          await this.patch(null, { ...this.status, server: "down" });

          this.showcaseCheckerService.start();
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

    const authorizationToken: string = this.app.get("raspberryAPIToken");
    const apiUrl: string = this.app.get("apiUrl");
    const raspberryId: number = this.app.get("raspberryId");
    const mediasService: Medias = this.app.service("medias");

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

    const channel: Channel = laravelEcho.private(`App.Models.Raspberry.${raspberryId}`);

    channel.notification(async (notification: Notification) => {
      const post = notification.post as Post; // Here we know we have post, since we control the data returned from the backend
      const media: Media = post.media;

      switch (this.getEventName(notification.type)) {
        // Since Laravel handles the data, at this moment, we don't need to check
        // which kind of event it is, because "showing" will come from API already
        // updated. However, if someday we decide to do something different based on
        // the event type, it's already prepared for it.
        default:
          try {
            const foundMedia = await mediasService.get(media.id);
            return mediasService.update(foundMedia._id, {
              ...foundMedia,
              posts: [post],
            });
          } catch (e) {
            if (e instanceof NotFound) {
              return mediasService.create({
                ...MediaAdapter.fromAPIToLocal(media),
                posts: [post],
              });
            }
          }
          break;
      }
    });

    await this.patch(null, { ...this.status, channelsConnected: true });
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
