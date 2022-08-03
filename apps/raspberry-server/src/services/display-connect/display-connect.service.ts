// Initializes the `display-connect` service on path `/display-connect`
import { ServiceAddons } from "@feathersjs/feathers";

import { Application } from "../../declarations";
import { DisplayConnect } from "./display-connect.class";
import hooks from "./display-connect.hooks";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    "display-connect": DisplayConnect & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/display-connect", new DisplayConnect(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("display-connect");

  service.hooks(hooks);
}
