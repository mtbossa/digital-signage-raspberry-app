import NeDB from "@seald-io/nedb";
import fs from "fs";
import path from "path";

import { Application } from "../declarations";
import logger from "../logger";
import { restartApp } from "../utils/AppController";

export interface Post {
  _id: number;
  mediaId: number;
  startTime: string;
  endTime: string;
  showing: boolean;
  startDate: string | null;
  endDate: string | null;
  exposeTime: number | null;
  recurrence?: {
    isoweekday: number | null;
    day: number | null;
    month: number | null;
    year: number | null;
  };
}

export default function (app: Application): NeDB<Post> {
  const dbPath = app.get("nedb");
  const modelPath = path.join(dbPath, "posts.db");
  let Model: NeDB<Post>;
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
