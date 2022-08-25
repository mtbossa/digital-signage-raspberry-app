import { HooksObject } from "@feathersjs/feathers";

import checkMediaDownloaded from "../../hooks/check-media-downloaded";
import convertStringIdToNumber from "../../hooks/convert-string-id-to-number";
import downloadMedia from "../../hooks/download-media";

export default {
  before: {
    all: [convertStringIdToNumber()],
    find: [],
    get: [],
    create: [checkMediaDownloaded()],
    update: [checkMediaDownloaded()],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [downloadMedia()],
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
