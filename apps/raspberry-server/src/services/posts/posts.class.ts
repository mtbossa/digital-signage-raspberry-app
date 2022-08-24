import { NotFound } from "@feathersjs/errors";
import { NedbServiceOptions, Service } from "feathers-nedb";

import MediaAdapter from "../../clients/intusAPI/adapters/media-adapter";
import { IntusAPI, Media, Post as APIPost } from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Post } from "../../models/posts.model";
import { Medias } from "../medias/medias.class";

// A type interface for our user (it does not validate any data)
export class Posts extends Service<Post> {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, private app: Application) {
    super(options);
  }
}
