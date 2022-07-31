// displays-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from "../declarations";
import { Model, Mongoose } from "mongoose";

export interface Display {
	_id: number;
	name: string;
	size: number;
	width: number;
	height: number;
	touch: boolean;
	apiToken: string;
	channelsConnected: boolean;
}

export default function (app: Application): Model<Display> {
	const modelName = "displays";
	const mongooseClient: Mongoose = app.get("mongooseClient");
	const { Schema } = mongooseClient;
	const schema = new Schema(
		{
			_id: { type: Number, required: true },
			name: { type: String, required: true },
			size: { type: Number, required: true },
			width: { type: Number, required: true },
			height: { type: Number, required: true },
			touch: { type: Boolean, required: true },
			apiToken: { type: String, required: true },
			channelsConnected: { type: Boolean, default: false },
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
	return mongooseClient.model<Display>(modelName, schema);
}
