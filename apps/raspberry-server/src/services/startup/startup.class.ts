import { Id, NullableId, Paginated, Params, ServiceMethods } from "@feathersjs/feathers";

import { ClientRequestError } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import logger from "../../logger";
import { Post } from "../../models/posts.model";

interface ServiceOptions {}

export class Startup implements Pick<ServiceMethods<any>, "create"> {
  app: Application;
  options: ServiceOptions;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  async create(data: any, params?: Params | any): Promise<any> {
    const postsService = this.app.service("posts");
    const postsSyncService = this.app.service("posts-sync");
    const serverStatusCheckerService = this.app.service("server-status-checker");
    const channelsConnectorService = this.app.service("backend-channels-connector");
    const showcaseChecker = this.app.service("showcase-checker");
    // When initializing the system, checks connection so when frontend connects
    // we already know if we have internet connection or not
    try {
      // Sets all posts to showing false, since when system is starting up, no post is showing.
      const currentPosts = (await postsService.find({ paginate: false })) as Post[];
      await Promise.allSettled(
        currentPosts.map((post) =>
          postsService.update(post._id, { ...post, showing: false })
        )
      );
      await postsSyncService.create({ synced: false });
      await channelsConnectorService.create({ channelsConnected: false });
    } catch (e) {
      logger.warn("Error while inital sync");
      logger.error(e);
      if (e instanceof ClientRequestError) {
        logger.warn("e instanceof ClientRequestError = Server status down");

        serverStatusCheckerService.status.server = "down";
      }
    }
    showcaseChecker.create({});
    serverStatusCheckerService.create({});

    return data;
  }
}
