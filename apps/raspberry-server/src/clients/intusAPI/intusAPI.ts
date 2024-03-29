import type { Stream } from "stream";

import logger from "../../logger";
import { InternalError } from "../../utils/errors/internal-error";
import * as HTTPUtil from "../../utils/Request";
import Storage from "../../utils/Storage";

interface PostResponse {
  data: Post[];
}

export type AvailableNotifications = "PostCreated" | "PostDeleted" | "PostUpdated";

export interface Notification {
  id: string;
  type: AvailableNotifications;
  [key: string]: any;
}

export interface PostDeletedNotification extends Notification {
  post_id: number;
  media_id: number;
  canDeleteMedia: boolean;
}

export interface PostCreatedNotification extends Notification {
  post: Post;
}

export interface PostUpdatedNotification extends Notification {
  post: Post;
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
  expired: boolean;
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
  canBeDeleted?: boolean;
}

export class ClientRequestError extends InternalError {
  constructor(message: string) {
    const internalMessage = "Unexpected error when trying to communicate with Intus API";
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
  readonly apiToken = process.env["RASPBERRY_API_TOKEN"];
  static apiUrl: string;

  constructor(
    protected request = new HTTPUtil.Request(),
    private storage: Storage = new Storage()
  ) {}

  public async downloadMedia(filename: string, pathToSave: string): Promise<string> {
    try {
      const response = await this.request.get<Stream>(
        `${IntusAPI.apiUrl}/api/media/${filename}/download`,
        {
          headers: { Authorization: `Bearer ${this.apiToken}` },
          responseType: "stream",
        }
      );

      response.data.pipe(this.storage.store(pathToSave));

      return new Promise((resolve, reject) => {
        response.data.on("end", () => {
          logger.debug(`response.data.on("end") received: ${filename}`);
          resolve(this.storage.makeCompletePath(pathToSave));
        });
        response.data.on("error", (err) => {
          logger.debug(`response.data.on("error") received: ${filename}`);
          reject(err);
        });
      });
    } catch (err) {
      if (err instanceof Error && HTTPUtil.Request.isRequestError(err)) {
        const error = HTTPUtil.Request.extractErrorData(err);
        throw new IntusAPIResponseError(`Error: ${error.data} Code: ${error.status}`);
      }
      // Non server (api) errors will fallback to a generic client error
      throw new ClientRequestError(JSON.stringify(err));
    }
  }

  public async fetchRaspberryPosts(): Promise<Post[]> {
    try {
      const response = await this.request.get<PostResponse>(
        `${IntusAPI.apiUrl}/api/raspberry/display/posts`,
        {
          headers: { Authorization: `Bearer ${this.apiToken}` },
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

  public async checkServerStatus(): Promise<{ status: "up" }> {
    try {
      const response = await this.request.get<{ status: "up" }>(
        `${IntusAPI.apiUrl}/api/server-status`,
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
