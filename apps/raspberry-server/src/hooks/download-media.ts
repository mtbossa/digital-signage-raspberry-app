// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";
import path from "path";

import intusAPI from "../clients/intusAPI/intusAPI";
import { Data as MediaData, Medias } from "../services/medias/medias.class";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const mediasService: Medias = context.app.service("medias");
    const media: MediaData = context.data;

    const savePath = path.resolve(context.app.get("medias"), media.path);

    try {
      console.log("DOWNLOADING MEDIA");
      await intusAPI.downloadMedia(media.filename, savePath);
      console.log("MEDIA DOWNLOAD FINISH");
      await mediasService.update(media._id, {
        ...media,
        downloaded: true,
      });
    } catch (e) {
      // TODO post to API that media download failed
      console.error(e);
    }

    return context;
  };
};
