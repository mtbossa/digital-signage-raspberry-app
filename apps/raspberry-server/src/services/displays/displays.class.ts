import { NotFound } from "@feathersjs/errors";
import { Service, MongooseServiceOptions } from "feathers-mongoose";
import {
	Display as APIDisplay,
	IntusAPI,
} from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Display } from "../../models/displays.model";

export class Displays extends Service<Display> {
	//eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(
		options: Partial<MongooseServiceOptions>,
		private app: Application,
		private intusAPI: IntusAPI = new IntusAPI()
	) {
		super(options);
	}

	public async sync() {
		console.log("[ SYNCING DISPLAYS ]");

		try {
			const displays: APIDisplay[] = await this.intusAPI.fetchStoreDisplays();

			// TODO filter response and log the rejected ones
			const res = await Promise.allSettled(
				displays.map(async (display: APIDisplay) => {
					// Checks if display already exists, if doesn't, will throw error NotFound and we'll create it.
					// Otherwise, update it.
					try {
						const foundDisplay = await super.get(display.id);
						return super.update(foundDisplay._id, {
							...foundDisplay,
						});
					} catch (e) {
						if (e instanceof NotFound) {
							return super.create({
								...display,
								_id: display.id,
							});
						}
					}
				})
			);
		} catch (e) {
			console.log("[ DISPLAYS SYNC FINISH WITH ERROR ]");

			this.app
				.service("displays")
				.emit("displays-sync-finish", { status: "finish" });

			throw e;
		}

		console.log("[ DISPLAYS SYNC FINISH ]");

		this.app
			.service("displays")
			.emit("displays-sync-finish", { status: "finish" });
	}
}
