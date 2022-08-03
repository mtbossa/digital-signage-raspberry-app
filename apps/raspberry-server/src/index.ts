import app from "./app";
import { ClientRequestError } from "./clients/intusAPI/intusAPI";
import logger from "./logger";

const port = app.get("port");
const server = app.listen(port);

const displaysService = app.service("displays");
const serverStatusCheckerService = app.service("server-status-checker");

process.on("unhandledRejection", (reason, p) =>
  logger.error("Unhandled Rejection at: Promise ", p, reason)
);

server.on("listening", async () => {
  logger.info("Feathers application started on http://%s:%d", app.get("host"), port);

  // When initializing the system, checks connection so when frontend is connected
  // we already know if we have internet connection or not
  try {
    await displaysService.setAllDisplaysDisconnectedFromLaravel();
    await displaysService.sync();
  } catch (e) {
    if (e instanceof Error) {
      console.error("Error while initial syncing: ", e.message);
    }
    if (e instanceof ClientRequestError) {
      console.log("[ SERVER DOWN WHILE SYNCING ]");

      await serverStatusCheckerService.patch(null, {
        ...serverStatusCheckerService.status,
        server: "down",
      });
    }
  }

  serverStatusCheckerService.start();
});
