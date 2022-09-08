import type { Stream } from "stream";

import { InternalError } from "../../utils/errors/internal-error";
import * as HTTPUtil from "../../utils/Request";
import Storage from "../../utils/Storage";

interface PostResponse {
  data: Post[];
}

interface PostExpiredResponse {
  data: PostExpired[];
}

export interface PostExpired {
  post_id: number;
  media_id: number;
  canDeleteMedia: boolean;
}

export type AvailableNotifications = "PostCreated" | "PostDeleted";

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
  readonly displayId = process.env["DISPLAY_ID"];
  readonly apiToken = process.env["DISPLAY_API_TOKEN"];
  readonly apiUrl = process.env["API_URL"];

  constructor(
    protected request = new HTTPUtil.Request(),
    private storage: Storage = new Storage()
  ) {}

  public async downloadMedia(filename: string, pathToSave: string): Promise<string> {
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
        response.data.on("error", (err) => {
          console.log("rejected err", err);
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

  public async fetchExpiredPosts(): Promise<PostExpired[]> {
    try {
      const response = await this.request.get<PostExpiredResponse>(
        `${this.apiUrl}/api/displays/${this.displayId}/posts`,
        {
          headers: { Authorization: `Bearer ${this.apiToken}` },
          params: {
            fromApp: true,
            expired: true,
          },
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

  public async fetchRaspberryPosts(): Promise<Post[]> {
    try {
      const response = await this.request.get<PostResponse>(
        `${this.apiUrl}/api/displays/${this.displayId}/posts`,
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
