import NeDB from "@seald-io/nedb";
import fs from "fs";
import path from "path";

import { Application } from "../declarations";
import logger from "../logger";
import { restartApp } from "../utils/AppController";

export interface Media {
  _id: number;
  path: string;
  filename: string;
  type: string;
  downloaded?: boolean;
}

export default function (app: Application): NeDB<Media> {
  const dbPath = app.get("nedb");
  const modelPath = path.join(dbPath, "medias.db");
  let Model: NeDB<Media>;
  try {
    Model = new NeDB({
      filename: modelPath,
      autoload: true,
    });
  } catch (e) {
    fs.unlink(modelPath, (err) => {
      if (err) throw err;
      logger.error(`${modelPath} was deleted because of data corruption`);
      restartApp();
    });
    throw new Error("Data corruption");
  }

  return Model;
}
