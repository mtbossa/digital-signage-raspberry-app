// Initializes the `server-status-checker` service on path `/server-status-checker`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../declarations";
import { ServerStatusChecker } from "./server-status-checker.class";
import hooks from "./server-status-checker.hooks";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    "server-status-checker": ServerStatusChecker & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/server-status-checker", new ServerStatusChecker(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("server-status-checker");

  service.hooks(hooks);
}
