import { Media as APIMedia } from "../intusAPI";
import { Media as LocalMedia } from "../../../models/medias.model";

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
