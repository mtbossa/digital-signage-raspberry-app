// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";
import path from "path";

import logger from "../logger";
import { Medias } from "../services/medias/medias.class";
import Storage from "../utils/Storage";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const storage = new Storage();
    const mediasService: Medias = context.app.service("medias");
    const mediaId = context.id!;

    const media = await mediasService.get(mediaId);

    try {
      await storage.delete(path.resolve(context.app.get("medias"), media.path));
    } catch (e) {
      logger.warn("Error while deleting media file");
      logger.error(e);
    }
    return context;
  };
};
