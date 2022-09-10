import NeDB from "@seald-io/nedb";
import path from "path";

import { Application } from "../declarations";

export interface Media {
  _id: number;
  path: string;
  filename: string;
  type: string;
  downloaded?: boolean;
}

export default function (app: Application): NeDB<Media> {
  const dbPath = app.get("nedb");
  const Model = new NeDB({
    filename: path.join(dbPath, "medias.db"),
    autoload: true,
  });

  return Model;
}
