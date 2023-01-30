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
import logger from "../../logger";
import { Medias } from "../../services/medias/medias.class";
import { BackendChannelsConnector } from "../backend-channels-connector/backend-channels-connector.class";
import { Posts } from "../posts/posts.class";
import { PostsSync } from "../posts-sync/posts-sync.class";
import { ShowcaseChecker } from "../showcase-checker/showcase-checker.class";

interface Data {}

interface ServiceOptions {}

export class ServerStatusChecker implements Pick<ServiceMethods<Data>, "create"> {
  app: Application;
  options: ServiceOptions;
  status: { server: "up" | "down" } = { server: "up" };
  interval: NodeJS.Timer | null = null;

  private requestTimeout: number;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;

    this.requestTimeout = this.app.get("serverCheckTimeout");
  }

  public async check() {
    return await intusAPI.checkServerStatus();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: Data, params?: Params): Promise<Data> {
    const postsSyncService = this.app.service("posts-sync");
    const channelsConnectorService = this.app.service("backend-channels-connector");

    logger.info("Starting Server Status Checker");
    this.interval = setInterval(async () => {
      try {
        logger.info("Checking server status");
        await this.check();
        logger.info("Server status up");

        // If server status was already up, do nothing
        if (this.status.server === "up") return;

        this.status.server = "up";

        await channelsConnectorService.create({});
        await postsSyncService.create({});
      } catch (e) {
        logger.warn("Error while checking server status");
        logger.error(e);
        if (e instanceof ClientRequestError) {
          logger.info("e instanceof ClientRequestError = Server status down");

          // If server status was already down, do nothing
          if (this.status.server === "down") return;

          this.status.server = "down";
        }
      }
    }, this.requestTimeout);

    return data;
  }

  async stop() {
    if (this.interval) clearInterval(this.interval);
  }
}
