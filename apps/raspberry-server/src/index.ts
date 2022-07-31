import logger from "./logger";
import app from "./app";
import intusAPI from "./clients/intusAPI/intusAPI";

const port = app.get("port");
const server = app.listen(port);

process.on("unhandledRejection", (reason, p) =>
	logger.error("Unhandled Rejection at: Promise ", p, reason)
);

server.on("listening", async () => {
	logger.info(
		"Feathers application started on http://%s:%d",
		app.get("host"),
		port
	);

	try {
		const res = await intusAPI.fetchStoreDisplays();
		const test = res;
	} catch {}
});
