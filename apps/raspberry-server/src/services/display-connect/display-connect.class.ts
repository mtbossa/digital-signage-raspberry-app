import {
	Id,
	NullableId,
	Paginated,
	Params,
	ServiceMethods,
} from "@feathersjs/feathers";
import { Application } from "../../declarations";

interface Data {
	displayId: number;
}

interface ServiceOptions {}

export class DisplayConnect implements ServiceMethods<Data> {
	app: Application;
	options: ServiceOptions;

	constructor(options: ServiceOptions = {}, app: Application) {
		this.options = options;
		this.app = app;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async find(params?: Params): Promise<Data[] | Paginated<Data>> {
		return [];
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async get(id: Id, params?: Params): Promise<Data> {
		return {
			displayId: 1,
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async create(data: Data, params?: Params): Promise<Data> {
		console.log("displayConnect: ", data);
		if (!params) return data;
		const { provider, connection } = params;
		if (!connection) return data;

		if (provider === "socketio") {
			this.app.channel(`display/${data.displayId}`).join(connection);
		}
		this.app.channel("anonymous").join(connection);

		return data;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async update(id: NullableId, data: Data, params?: Params): Promise<Data> {
		return data;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async patch(id: NullableId, data: Data, params?: Params): Promise<Data> {
		return data;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async remove(id: NullableId, params?: Params): Promise<Data> {
		return { displayId: 1 };
	}
}
