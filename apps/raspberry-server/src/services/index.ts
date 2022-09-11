import { Application } from "../declarations";
import backendChannelsConnector from "./backend-channels-connector/backend-channels-connector.service";
import mediaPosts from "./media-posts/media-posts.service";
import medias from "./medias/medias.service";
import posts from "./posts/posts.service";
import postsSync from "./posts-sync/posts-sync.service";
import serverStatusChecker from "./server-status-checker/server-status-checker.service";
import showcaseChecker from "./showcase-checker/showcase-checker.service";
import startup from "./startup/startup.service";
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(posts);
  app.configure(medias);
  app.configure(mediaPosts);
  app.configure(postsSync);
  app.configure(showcaseChecker);
  app.configure(backendChannelsConnector);
  app.configure(serverStatusChecker);
  app.configure(startup);
}
