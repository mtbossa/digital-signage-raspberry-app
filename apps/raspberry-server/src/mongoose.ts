import mongoose from "mongoose";
import { Application } from "./declarations";
import logger from "./logger";

export default function (app: Application): void {
	const dbHost = app.get("dbHost");
	const dbPort = app.get("dbPort");
	const dbUser = app.get("dbUser");
	const dbPassword = app.get("dbPassword");
	const dbName = app.get("dbName");

	let dbUrl = "mongodb://";
	if (dbUser && dbPassword) {
		dbUrl = dbUrl + `${dbUser}:${dbPassword}@`;
	}

	dbUrl = dbUrl + `${dbHost}:${dbPort}`;

	if (dbName) {
		dbUrl = dbUrl + `/${dbName}`;
	}

	mongoose.connect(dbUrl).catch(err => {
		logger.error(err);
		process.exit(1);
	});

	app.set("mongooseClient", mongoose);
}
