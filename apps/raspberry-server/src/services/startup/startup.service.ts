// Initializes the `startup` service on path `/startup`
import { ServiceAddons } from "@feathersjs/feathers";

import { Application } from "../../declarations";
import { Startup } from "./startup.class";
import hooks from "./startup.hooks";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    startup: Startup & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/startup", new Startup(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("startup");

  service.hooks(hooks);
}
