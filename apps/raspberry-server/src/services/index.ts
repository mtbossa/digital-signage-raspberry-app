import { Application } from "../declarations";
import posts from "./posts/posts.service";
import medias from "./medias/medias.service";
import serverStatusChecker from "./server-status-checker/server-status-checker.service";
import showcaseChecker from "./showcase-checker/showcase-checker.service";
import displayConnect from './display-connect/display-connect.service';
import displays from './displays/displays.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(medias);
  app.configure(posts);
  app.configure(showcaseChecker);
  app.configure(serverStatusChecker);
  app.configure(displayConnect);
  app.configure(displays);
}
