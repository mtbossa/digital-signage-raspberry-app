// Initializes the `media-posts` service on path `/media-posts`
import { ServiceAddons } from "@feathersjs/feathers";

import { Application } from "../../declarations";
import { MediaPosts } from "./media-posts.class";
import hooks from "./media-posts.hooks";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    "media-posts": MediaPosts & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/media-posts", new MediaPosts(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("media-posts");

  service.hooks(hooks);
}
