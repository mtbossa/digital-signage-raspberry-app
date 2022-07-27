// medias-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from "../declarations";
import { Model, Mongoose } from "mongoose";

export interface Media {
  _id: number;
  path: string;
  filename: string;
  type: string;
  downloaded?: boolean;
}

export default function (app: Application): Model<Media> {
  const modelName = "medias";
  const mongooseClient: Mongoose = app.get("mongooseClient");
  const { Schema } = mongooseClient;
  const schema = new Schema(
    {
      _id: Number,
      path: { type: String, required: true },
      type: { type: String, required: true },
      filename: { type: String, required: true },
      downloaded: { type: Boolean, required: true, default: false },
    },
    {
      timestamps: true,
    }
  );

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    (mongooseClient as any).deleteModel(modelName);
  }
  return mongooseClient.model<Media>(modelName, schema);
}
