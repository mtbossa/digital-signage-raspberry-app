// Initializes the `showcaseChecker` service on path `/showcase-checker`
import { ServiceAddons } from "@feathersjs/feathers";

import { Application } from "../../declarations";
import DayjsDateProvider from "../../providers/implementations/DayjsDateProvider";
import { ShowcaseChecker } from "./showcase-checker.class";
import hooks from "./showcase-checker.hooks";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    "showcase-checker": ShowcaseChecker & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use(
    "/showcase-checker",
    new ShowcaseChecker(options, app, new DayjsDateProvider())
  );

  // Get our initialized service so that we can register hooks
  const service = app.service("showcase-checker");

  service.hooks(hooks);
}
