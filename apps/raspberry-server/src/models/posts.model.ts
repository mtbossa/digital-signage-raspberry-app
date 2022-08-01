// posts-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from "../declarations";
import { Model, Mongoose } from "mongoose";

export interface Post {
	_id: number;
	mediaId: number;
	displays: Array<{ _id: number; showing: boolean }>;
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

export default function (app: Application): Model<Post> {
	const modelName = "posts";
	const mongooseClient: Mongoose = app.get("mongooseClient");
	const { Schema } = mongooseClient;
	const displaysSchema = new Schema({
		_id: { type: Number, required: true },
		showing: { type: Boolean, default: false },
	});
	const recurrenceSchema = new Schema({
		isoweekday: { type: Number, default: null },
		day: { type: Number, default: null },
		month: { type: Number, default: null },
		year: { type: Number, default: null },
	});
	const schema = new Schema(
		{
			_id: Number,
			mediaId: { type: Number, required: true },
			startTime: { type: String, required: true },
			endTime: { type: String, required: true },
			showing: { type: Boolean, required: true },
			startDate: { type: String, default: null },
			endDate: { type: String, default: null },
			exposeTime: { type: Number, default: null },
			recurrence: recurrenceSchema,
			displays: [displaysSchema],
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
	return mongooseClient.model<Post>(modelName, schema);
}
