// Initializes the `posts-sync` service on path `/posts-sync`
import { ServiceAddons } from "@feathersjs/feathers";

import { Application } from "../../declarations";
import { PostsSync } from "./posts-sync.class";
import hooks from "./posts-sync.hooks";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    "posts-sync": PostsSync & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/posts-sync", new PostsSync(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("posts-sync");

  service.hooks(hooks);
}
