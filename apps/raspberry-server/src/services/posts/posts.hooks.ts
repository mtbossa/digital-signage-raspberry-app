import { HooksObject } from "@feathersjs/feathers";

import convertStringIdToNumber from "../../hooks/convert-string-id-to-number";
import emitShowing from "../../hooks/emit-showing";

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
    create: [],
    update: [],
    patch: [],
    remove: [emitShowing()],
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
