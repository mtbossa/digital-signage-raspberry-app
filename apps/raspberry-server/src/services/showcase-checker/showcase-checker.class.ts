import { Id, NullableId, Paginated, Params, ServiceMethods } from "@feathersjs/feathers";

import { Recurrence } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import logger from "../../logger";
import { Post } from "../../models/posts.model";
import { DateProvider } from "../../providers/DateProvider";
import { Posts } from "../posts/posts.class";

interface Data {}

interface ServiceOptions {}

export class ShowcaseChecker implements Pick<ServiceMethods<Data>, "create"> {
  app: Application;
  options: ServiceOptions;
  public status = { running: false };

  private checkTimeout: number;
  private interval?: NodeJS.Timer;

  constructor(
    options: ServiceOptions = {},
    app: Application,
    private dateProvider: DateProvider
  ) {
    this.options = options;
    this.app = app;

    this.checkTimeout = this.app.get("showcaseCheckTimeout");
  }

  async create(
    data: Partial<Data> | Partial<Data>[],
    params?: Params | undefined
  ): Promise<Data | Data[]> {
    if (this.status.running) return this.status;

    logger.info("Starting showcase checker");
    this.status.running = true;

    this.interval = setInterval(async () => {
      logger.info("Checking all posts showcase");
      await this.checkAllPosts();
    }, this.checkTimeout);

    return this.status;
  }

  private async emitStartPost(post: Post) {
    const postsService = this.app.service("posts");
    const mediasService = this.app.service("medias");

    const media = await mediasService.get(post.mediaId);
    if (media.downloaded) {
      await postsService.update(post._id, { ...post, showing: true });
      logger.info("Emitting start-post: ", { postId: post._id });
      postsService.emit("start-post", {
        _id: post._id,
        exposeTime: post.exposeTime,
        media,
      });
    }
  }

  private async emitEndPost(post: Post) {
    const postsService = this.app.service("posts");

    logger.info("Emitting end-post: ", { postId: post._id });
    await postsService.update(post._id, { ...post, showing: false });
    postsService.emit("end-post", {
      _id: post._id,
    });
  }

  public async checkPost(post: Post) {
    if (this.shouldShow(post) && !post.showing) {
      this.emitStartPost(post);
    } else if (!this.shouldShow(post) && post.showing) {
      this.emitEndPost(post);
    }
  }

  public async checkAllPosts() {
    const postsService = this.app.service("posts");

    const allPosts: Post[] = (await postsService.find({
      paginate: false,
    })) as Post[];

    allPosts.forEach(async (post) => {
      if (this.shouldShow(post) && !post.showing) {
        this.emitStartPost(post);
      } else if (!this.shouldShow(post) && post.showing) {
        this.emitEndPost(post);
      }
    });
  }

  async stop() {
    if (!this.status.running) return;

    this.status.running = false;

    clearInterval(this.interval);

    logger.info("Stopping showcase checker");
  }

  public shouldShow(
    post: Pick<Post, "startDate" | "endDate" | "startTime" | "endTime" | "recurrence">
  ) {
    if (!post.startDate && !post.endDate) return this.calculateRecurrent(post);
    const shouldShow = this.calculateNonRecurrent(post);
    return shouldShow;
  }

  private calculateRecurrent(
    post: Pick<Post, "startDate" | "endDate" | "startTime" | "endTime" | "recurrence">
  ): boolean {
    const recurrence = post.recurrence!;
    const isRecurrenceDay = Object.entries(recurrence)
      .map(([unit, value]) => {
        if (!value) return true;
        if (
          unit === "day" ||
          unit === "isoweekday" ||
          unit === "month" ||
          unit === "year"
        ) {
          return this.dateProvider.isTodaySameUnitValue(value, unit);
        }
        return false;
      })
      .every((isTodaySameUnitValueResult) => isTodaySameUnitValueResult === true);

    if (!isRecurrenceDay) return false;

    return this.checkTime(post);
  }

  private calculateNonRecurrent(
    post: Pick<Post, "startDate" | "endDate" | "startTime" | "endTime" | "recurrence">
  ): boolean {
    if (
      this.dateProvider.isDateBeforeToday(post.endDate!) ||
      this.dateProvider.isDateAfterToday(post.startDate!)
    ) {
      return false;
    }

    return this.checkTime(post);
  }

  private checkTime(
    post: Pick<Post, "startDate" | "endDate" | "startTime" | "endTime" | "recurrence">
  ): boolean {
    return this.dateProvider.isNowBetweenTimes(post.startTime, post.endTime);
  }
}
