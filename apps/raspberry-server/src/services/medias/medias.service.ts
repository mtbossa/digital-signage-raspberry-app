// Initializes the `medias` service on path `/medias`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../declarations";
import { Medias } from "./medias.class";
import createModel from "../../models/medias.model";
import hooks from "./medias.hooks";
import { MongooseServiceOptions } from "feathers-mongoose/types";

// Add this service to the service type index
declare module "../../declarations" {
  interface ServiceTypes {
    medias: Medias & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options: Partial<MongooseServiceOptions<any>> = {
    Model: createModel(app),
    whitelist: ["$populate"],
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/medias", new Medias(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("medias");

  service.hooks(hooks);
}
