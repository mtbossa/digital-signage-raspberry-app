import puppeteer from "puppeteer-core";

import app from "./app";
import logger from "./logger";

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
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: "/usr/bin/chromium-browser",
      args: ["--kiosk", "--ingonito"],
      ignoreDefaultArgs: [
        "--enable-automation",
        "--disable-extensions",
        "--disable-setuid-sandbox",
        "--no-sandbox",
      ],
      timeout: 0,
      defaultViewport: null,
    });
    const page = (await browser.pages())[0];
    await page.goto("http://localhost:45691");
  })();
}
