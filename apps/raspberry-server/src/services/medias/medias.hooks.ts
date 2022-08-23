import { HooksObject } from "@feathersjs/feathers";

import createOrUpdatePosts from "../../hooks/create-or-update-posts";
import downloadMedia from "../../hooks/download-media";

export default {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [downloadMedia(), createOrUpdatePosts()],
    update: [createOrUpdatePosts()],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};
