import { NedbServiceOptions, Service } from "feathers-nedb";

import { Post } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Media } from "../../models/medias.model";

export class Medias extends Service<Media> {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options);
  }
}
