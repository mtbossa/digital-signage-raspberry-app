import { Id, NullableId, Paginated, Params, ServiceMethods } from "@feathersjs/feathers";

import { Application } from "../../declarations";
import { Post } from "../../models/posts.model";
import { DateProvider } from "../../providers/DateProvider";
import { Posts } from "../posts/posts.class";

interface Data {
  running: boolean;
}

interface ServiceOptions {}

export class ShowcaseChecker implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;
  public status: Data = { running: false };

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

    await this.patch(null, { running: true });

    this.interval = setInterval(async () => {
      console.log("[ CHECKING POSTS SHOWCASE ]");

      const allPosts: Post[] = (await this.postsService.find({
        paginate: false,
      })) as Post[];

      allPosts.forEach(async (post) => {
        if (this.shouldShow(post) && !post.showing) {
          await this.postsService.update(post._id, { ...post, showing: true });
        } else if (!this.shouldShow(post) && post.showing) {
          await this.postsService.update(post._id, { ...post, showing: false });
        }
      });
    }, this.checkTimeout);
  }

  async stop() {
    if (!this.status.running) return;

    await this.patch(null, { running: false });

    clearInterval(this.interval);

    console.log("[ STOPPING CHECKING POSTS SHOWCASE ]");
  }

  private shouldShow(post: Post) {
    if (!post.startDate && !post.endDate) return this.calculateRecurrent(post);

    return this.calculateNonRecurrent(post);
  }

  private calculateRecurrent(post: Post): boolean {
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

  private calculateNonRecurrent(post: Post): boolean {
    if (
      this.dateProvider.isDateBeforeToday(post.endDate!) ||
      this.dateProvider.isDateAfterToday(post.startDate!)
    ) {
      return false;
    }

    return this.checkTime(post);
  }

  private checkTime(post: Post): boolean {
    return this.dateProvider.isNowBetweenTimes(post.startTime, post.endTime);
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
