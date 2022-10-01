import puppeteer from "puppeteer-core";

import app from "./app";
import logger from "./logger";
import startApp from "./utils/browser";

const port = app.get("port");
const server = app.listen(port);

process.on("unhandledRejection", (reason, p) => {
  logger.error("Unhandled Rejection at: Promise ", p, reason);
  console.error(p, reason);
  if (reason instanceof Error) {
    logger.error("Message: ", reason.message);
  }
});

server.on("listening", async () => {
  logger.info(`Feathers application started on http://${app.get("host")}:${port}`);
});

if (process.env.NODE_ENV !== "development") {
  (async () => {
    const browserController = await startApp();
    app.set("browserController", browserController);
  })();
}
