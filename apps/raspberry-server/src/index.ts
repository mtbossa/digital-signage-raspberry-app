import app from "./app";
import logger from "./logger";
import BrowserController from "./utils/BrowserController";

const port = app.get("port");
const server = app.listen(port);

process.on("unhandledRejection", (reason, p) => {
  logger.error(`Unhandled Rejection at: Promise ${p}, ${reason}`);
});

server.on("listening", async () => {
  logger.info(`Feathers application started on http://${app.get("host")}:${port}`);
});

const shouldOpenBrowser = (): boolean => {
  return !process.env.OPEN_BROWSER || process.env.OPEN_BROWSER === "true";
};

if (shouldOpenBrowser()) {
  (async () => {
    await BrowserController.startApp();
  })();
}
