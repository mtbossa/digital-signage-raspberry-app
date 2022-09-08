// Initializes the `backend-channels-connector` service on path `/backend-channels-connector`
import { ServiceAddons } from "@feathersjs/feathers";

import { Application } from "../../declarations";
import { BackendChannelsConnector } from "./backend-channels-connector.class";
import hooks from "./backend-channels-connector.hooks";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    "backend-channels-connector": BackendChannelsConnector & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/backend-channels-connector", new BackendChannelsConnector(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("backend-channels-connector");

  service.hooks(hooks);
}
