import { NotFound } from "@feathersjs/errors";
import { Id, NullableId, Paginated, Params, ServiceMethods } from "@feathersjs/feathers";
import { Application } from "../../declarations";
import { Displays } from "../displays/displays.class";
import { Posts } from "../posts/posts.class";

interface Data {
  displayId: number;
}

interface ServiceOptions {}

export class DisplayConnect implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;
  displaysService: Displays;
  postsService: Posts;

  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
    this.displaysService = this.app.service("displays");
    this.postsService = this.app.service("posts");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find(params?: Params): Promise<Data[] | Paginated<Data>> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get(id: Id, params?: Params): Promise<Data> {
    return { displayId: 1 };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: Data, params?: Params): Promise<Data> {
    console.log(`[ DISPLAY ${data.displayId} CONNECTED ]`);

    if (!data.displayId || !params) return data;

    const { connection } = params;

    if (!connection) return data;

    try {
      const display = await this.displaysService.get(data.displayId);

      this.app.channel(`display/${display._id}`).join(connection);
      this.app.channel("anonymous").join(connection);

      await this.postsService.sync(display);
      await this.displaysService.connectToLaravelChannels(display);

      return data;
    } catch (e) {
      if (e instanceof NotFound) {
        console.log(`Display ${data.displayId} not found when frontend connecting`);
      }
      return data;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async patch(id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove(id: NullableId, params?: Params): Promise<Data> {
    return { displayId: 1 };
  }
}
