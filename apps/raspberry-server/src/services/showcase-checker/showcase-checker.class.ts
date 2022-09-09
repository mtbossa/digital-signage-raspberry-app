import { Id, NullableId, Paginated, Params, ServiceMethods } from "@feathersjs/feathers";

import { Recurrence } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Post } from "../../models/posts.model";
import { DateProvider } from "../../providers/DateProvider";
import { Posts } from "../posts/posts.class";

interface Data {}

interface ServiceOptions {}

export class ShowcaseChecker implements Partial<ServiceMethods<Data>> {
  app: Application;
  options: ServiceOptions;
  public status = { running: false };

  private checkTimeout: number;
  private postsService: Posts;
  private interval?: NodeJS.Timer;

  constructor(
    options: ServiceOptions = {},
    app: Application,
    private dateProvider: DateProvider
  ) {
    this.options = options;
    this.app = app;

    this.checkTimeout = this.app.get("showcaseCheckTimeout");
    this.postsService = this.app.service("posts");
  }

  async start() {
    if (this.status.running) return;

    console.log("[ STARTING CHECKING POSTS SHOWCASE ]");

    this.status.running = true;

    this.interval = setInterval(async () => {
      console.log("[ CHECKING POSTS SHOWCASE ]");
      await this.checkPosts();
    }, this.checkTimeout);
  }

  public async checkPosts() {
    const postsService = this.app.service("posts");
    const mediasService = this.app.service("medias");

    const allPosts: Post[] = (await this.postsService.find({
      paginate: false,
    })) as Post[];

    allPosts.forEach(async (post) => {
      if (this.shouldShow(post) && !post.showing) {
        const media = await mediasService.get(post.mediaId);
        if (media.downloaded) {
          await this.postsService.update(post._id, { ...post, showing: true });
          console.log("[ EVENT start-post ] Emitting start-post: ", { postId: post._id });
          postsService.emit("start-post", {
            _id: post._id,
            exposeTime: post.exposeTime,
            media,
          });
        }
      } else if (!this.shouldShow(post) && post.showing) {
        console.log("[ EVENT end-post ] Emitting end-post: ", { postId: post._id });
        await this.postsService.update(post._id, { ...post, showing: false });
        postsService.emit("end-post", {
          _id: post._id,
        });
      }
    });
  }

  async stop() {
    if (!this.status.running) return;

    this.status.running = false;

    clearInterval(this.interval);

    console.log("[ STOPPING CHECKING POSTS SHOWCASE ]");
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
