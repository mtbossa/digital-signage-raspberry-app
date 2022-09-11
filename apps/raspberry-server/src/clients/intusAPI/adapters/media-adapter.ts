import { Media as LocalMedia } from "../../../models/medias.model";
import { Media as APIMedia } from "../intusAPI";

export default class MediaAdapter {
  public static fromAPIToLocal(media: APIMedia): LocalMedia {
    return {
      _id: media.id,
      type: media.type,
      filename: media.filename,
      path: media.path,
    };
  }
}
