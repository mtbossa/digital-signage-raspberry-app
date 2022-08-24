import { NedbServiceOptions, Service } from "feathers-nedb";

import { Post } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Media } from "../../models/medias.model";

export interface Data extends Media {
  posts: Post[]; // Receives the posts so it can be passed along with the context, however, won't be saved in the database here
  downloaded?: boolean; // Makes it optional since we need to update its value when media finished downloading
}
export class Medias extends Service<Data> {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options);
  }
}
