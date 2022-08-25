// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from "@feathersjs/feathers";
import path from "path";

import { Media } from "../models/medias.model";
import { Medias } from "../services/medias/medias.class";
import Storage from "../utils/Storage";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const media: Media = context.data;

    // Since backend doesn't know if media is downloaded or not, when we receive a new media from it
    // there won't be "downloaded" attribute, so will always try to download it at "download-media" hook.
    // Here we always check if the media is actually downloaded before updating/creating,
    // so when creating/updating the media in the database, the downloaded field is stored and when
    // "download-media" hook is reached, the current media will have the "downloaded" attribute with it.
    // If we don't perform this check, when we receive new media data from the Laravel API, we'll upsert it
    // in the database without the downloaded attribute.
    if (!media.downloaded) {
      if (await Storage.fileExists(path.resolve(context.app.get("medias"), media.path))) {
        media.downloaded = true;
      } else {
        media.downloaded = false;
      }
    }

    return context;
  };
};
