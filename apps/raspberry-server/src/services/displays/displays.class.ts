import { NotFound } from "@feathersjs/errors";
import { Service, MongooseServiceOptions } from "feathers-mongoose";
import Pusher, { Options } from "pusher-js";
import Echo, { Channel } from "laravel-echo";
import {
	ClientRequestError,
	Display as APIDisplay,
	IntusAPI,
	Media,
	Post,
} from "../../clients/intusAPI/intusAPI";
import { Application } from "../../declarations";
import { Display } from "../../models/displays.model";
import { Medias } from "../medias/medias.class";
import MediaAdapter from "../../clients/intusAPI/adapters/media-adapter";
import { Params } from "@feathersjs/feathers";
import { Posts } from "../posts/posts.class";
import { ShowcaseChecker } from "../showcase-checker/showcase-checker.class";
import { ServerStatusChecker } from "../server-status-checker/server-status-checker.class";

type AvailableNotifications = "PostStarted" | "PostEnded";
interface Notification {
	id: string;
	type: AvailableNotifications;
	[key: string]: any;
}

export class Displays extends Service<Display> {
	private displaysService: Displays;

	//eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(
		options: Partial<MongooseServiceOptions>,
		private app: Application,
		private intusAPI: IntusAPI = new IntusAPI()
	) {
		super(options);

		this.displaysService = this.app.service("displays");
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
				.emit("displays-sync-finish", { status: "failed" });

			throw e;
		}

		console.log("[ DISPLAYS SYNC FINISH ]");

		this.app
			.service("displays")
			.emit("displays-sync-finish", { status: "finish" });
	}

	public async connectToLaravelChannels(display: Display) {
		// Channels could already be connected, if when starting there was internet connection and server was up.
		// Only won't be connected to the channels if when the system started, there was no connection to the server.
		if (display.channelsConnected) return;

		console.log(`[ CONNECTING DISPLAY ${display._id} TO LARAVEL CHANNELS ]`);

		const authorizationToken: string = display.apiToken;
		const apiUrl: string = this.app.get("apiUrl");
		const raspberryId: number = display._id;
		const mediasService: Medias = this.app.service("medias");

		const options: Options = {
			authEndpoint: `${apiUrl}/api/broadcasting/auth`,
			forceTLS: true,
			cluster: "sa1",
			enabledTransports: ["ws", "wss"],
			auth: {
				headers: {
					Authorization: `Bearer ${authorizationToken}`,
				},
			},
		};

		const pusher: Pusher = new Pusher("67f6f5d1618646d3ea95", options);

		const laravelEcho: Echo = new Echo({
			...options,
			broadcaster: "pusher",
			key: "67f6f5d1618646d3ea95",
			client: pusher,
			auth: {
				withCredentials: true,
				headers: {
					Authorization: `Bearer ${authorizationToken}`,
				},
			},
		});

		const channel: Channel = laravelEcho.private(
			`App.Models.Raspberry.${raspberryId}`
		);

		channel.notification(async (notification: Notification) => {
			const post = notification.post as Post; // Here we know we have post, since we control the data returned from the backend
			const media: Media = post.media;

			switch (this.getEventName(notification.type)) {
				// Since Laravel handles the data, at this moment, we don't need to check
				// which kind of event it is, because "showing" will come from API already
				// updated. However, if someday we decide to do something different based on
				// the event type, it's already prepared for it.
				default:
					try {
						const foundMedia = await mediasService.get(media.id);
						return mediasService.update(foundMedia._id, {
							...foundMedia,
							posts: [post],
						});
					} catch (e) {
						if (e instanceof NotFound) {
							return mediasService.create({
								...MediaAdapter.fromAPIToLocal(media),
								posts: [post],
							});
						}
					}
					break;
			}
		});

		await super.patch(display._id, { ...display, channelsConnected: true });
	}

	public async connect(
		displayId: number,
		params?: Params
	): Promise<{ connected: boolean; reason?: any }> {
		console.log(`[ DISPLAY ${displayId} CONNECTED ]`);

		if (!displayId || !params)
			return { connected: false, reason: "No params or displayId provided" };

		const { connection } = params;

		if (!connection)
			return { connected: false, reason: "No websocket connection" };

		try {
			const display = await super.get(displayId);

			this.app.channel(`display/${display._id}`).join(connection);
			this.app.channel("anonymous").join(connection);

			await this.app.service("posts").sync(display);

			return { connected: true };
		} catch (e) {
			if (e instanceof NotFound) {
				console.log(`Display ${displayId} not found when frontend connecting`);
			}
			return { connected: false, reason: e };
		}
	}

	private getEventName(laravelEvent: string): AvailableNotifications {
		const afterLastSlash: AvailableNotifications = laravelEvent.substring(
			laravelEvent.lastIndexOf("\\") + 1
		) as AvailableNotifications;

		return afterLastSlash;
	}
}
