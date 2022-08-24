import { HooksObject } from "@feathersjs/feathers";

import convertStringIdToNumber from "../../hooks/convert-string-id-to-number";
import downloadMedia from "../../hooks/download-media";

export default {
  before: {
    all: [convertStringIdToNumber()],
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
    create: [downloadMedia()],
    update: [],
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
