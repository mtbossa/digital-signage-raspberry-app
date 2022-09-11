// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";
import path from "path";

import intusAPI from "../clients/intusAPI/intusAPI";
import logger from "../logger";
import { Media } from "../models/medias.model";
import { Medias } from "../services/medias/medias.class";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const mediasService: Medias = context.app.service("medias");
    const media: Media = context.data;

    const savePath = path.resolve(context.app.get("medias"), media.path);

    if (media.downloaded) return context;

    try {
      logger.info(`Starting to download media: ${media.filename}`);
      await intusAPI.downloadMedia(media.filename, savePath);
      logger.info(`Media successfully downloaded: ${media.filename}`);
      await mediasService.update(media._id, {
        ...media,
        downloaded: true,
      });
    } catch (e) {
      // TODO post to API that media download failed
      logger.error(`Error while downloading media: ${media.filename}`);
      console.error(e);
    }

    return context;
  };
};
