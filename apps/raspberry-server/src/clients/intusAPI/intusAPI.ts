import { InternalError } from "../../utils/errors/internal-error";
import * as HTTPUtil from "../../utils/Request";
import Storage from "../../utils/Storage";
import type { Stream } from "stream";

interface PostResponse {
	data: Post[];
}

// Media here is mandatory, since we always send the post with the media from the backend
export interface Post {
	id: number;
	start_date: string | null;
	end_date: string | null;
	start_time: string;
	end_time: string;
	expose_time: number | null;
	media: Media;
	showing: boolean;
	recurrence?: Recurrence;
}

export interface Recurrence {
	day: number;
	isoweekday: number;
	month: number;
	year: number;
}

export interface Media {
	id: number;
	path: string;
	type: string;
	filename: string;
}
export interface Display {
	id: number;
	name: string;
	size: number;
	width: number;
	height: number;
	touch: boolean;
}

export class ClientRequestError extends InternalError {
	constructor(message: string) {
		const internalMessage =
			"Unexpected error when trying to communicate with Intus API";
		super(`${internalMessage}: ${message}`);
	}
}
export class IntusAPIResponseError extends InternalError {
	constructor(message: string) {
		const internalMessage = "Unexpected error returned by Intus API service";
		super(`${internalMessage}: ${message}`);
	}
}

export class IntusAPI {
	readonly raspberryId = process.env["RASPBERRY_ID"];
	readonly storeId = process.env["STORE_ID"];
	readonly storeApiToken = process.env["STORE_API_TOKEN"];
	readonly apiToken = process.env["RASPBERRY_API_TOKEN"];
	readonly apiUrl = process.env["API_URL"];

	constructor(
		protected request = new HTTPUtil.Request(),
		private storage: Storage = new Storage()
	) {}

	public async downloadMedia(
		filename: string,
		pathToSave: string
	): Promise<string> {
		try {
			const response = await this.request.get<Stream>(
				`${this.apiUrl}/api/media/${filename}/download`,
				{
					headers: { Authorization: `Bearer ${this.apiToken}` },
					responseType: "stream",
				}
			);

			response.data.pipe(this.storage.store(pathToSave));

			return new Promise((resolve, reject) => {
				response.data.on("end", () => {
					console.log(`[ RESOLVE END - MEDIA DOWNLOAD FINISH ${filename}]`);
					resolve(this.storage.makeCompletePath(pathToSave));
				});
				response.data.on("error", err => {
					console.log("rejected err", err);
					reject(err);
				});
			});
		} catch (err) {
			if (err instanceof Error && HTTPUtil.Request.isRequestError(err)) {
				const error = HTTPUtil.Request.extractErrorData(err);
				throw new IntusAPIResponseError(
					`Error: ${error.data} Code: ${error.status}`
				);
			}
			// Non server (api) errors will fallback to a generic client error
			throw new ClientRequestError(JSON.stringify(err));
		}
	}

	public async fetchDisplayPosts(displayId: number): Promise<Post[]> {
		try {
			const response = await this.request.get<PostResponse>(
				`${this.apiUrl}/api/displays/${displayId}/posts`,
				{
					headers: { Authorization: `Bearer ${this.storeApiToken}` },
				}
			);

			return response.data.data;
		} catch (err: unknown) {
			if (err instanceof Error && HTTPUtil.Request.isRequestError(err)) {
				const error = HTTPUtil.Request.extractErrorData(err);
				throw new IntusAPIResponseError(
					`Error: ${JSON.stringify(error.data)} Code: ${error.status}`
				);
			}
			// Non server (api) errors will fallback to a generic client error
			throw new ClientRequestError(JSON.stringify(err));
		}
	}

	public async fetchStoreDisplays(): Promise<Display[]> {
		try {
			const response = await this.request.get<Display[]>(
				`${this.apiUrl}/api/store/${this.storeId}/displays`,
				{
					headers: { Authorization: `Bearer ${this.storeApiToken}` },
				}
			);

			return response.data;
		} catch (err: unknown) {
			if (err instanceof Error && HTTPUtil.Request.isRequestError(err)) {
				const error = HTTPUtil.Request.extractErrorData(err);
				throw new IntusAPIResponseError(
					`Error: ${JSON.stringify(error.data)} Code: ${error.status}`
				);
			}
			// Non server (api) errors will fallback to a generic client error
			throw new ClientRequestError(JSON.stringify(err));
		}
	}

	public async checkServerStatus(): Promise<{ status: "up" }> {
		try {
			const response = await this.request.get<{ status: "up" }>(
				`${this.apiUrl}/api/server-status`,
				{
					headers: { Authorization: `Bearer ${this.apiToken}` },
				}
			);

			return response.data;
		} catch (err: unknown) {
			if (err instanceof Error && HTTPUtil.Request.isRequestError(err)) {
				const error = HTTPUtil.Request.extractErrorData(err);
				throw new IntusAPIResponseError(
					`Error: ${JSON.stringify(error.data)} Code: ${error.status}`
				);
			}
			// Non server (api) errors will fallback to a generic client error
			throw new ClientRequestError(JSON.stringify(err));
		}
	}
}

const intusAPI = new IntusAPI();

export default intusAPI;
