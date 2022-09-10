import NeDB from "@seald-io/nedb";
import path from "path";

import { Application } from "../declarations";

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
  const Model = new NeDB({
    filename: path.join(dbPath, "posts.db"),
    autoload: true,
  });

  return Model;
}
