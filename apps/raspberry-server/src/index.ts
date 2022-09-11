import app from "./app";
import logger from "./logger";

const port = app.get("port");
const server = app.listen(port);

process.on("unhandledRejection", (reason, p) =>
  logger.error("Unhandled Rejection at: Promise ", p, reason)
);

server.on("listening", async () => {
  logger.info(`Feathers application started on http://${app.get("host")}:${port}`);
});
