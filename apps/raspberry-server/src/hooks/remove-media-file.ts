// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";

import Storage from "../utils/Storage";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const storage = new Storage();
    const media = context.data;

    try {
      await storage.delete(media.path);
    } catch (e) {
      console.error("Error while deleting media file: ", e);
    }
    return context;
  };
};
