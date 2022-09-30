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
  const interval = setInterval(async () => {
    try {
      const browser = await puppeteer.launch({
        headless: false,
        executablePath: "/usr/bin/chromium-browser",
        args: ["--kiosk", "--ingonito"],
        ignoreDefaultArgs: ["--enable-automation", "--disable-extensions"],
        timeout: 10000,
        defaultViewport: null,
      });

      clearInterval(interval);

      const page = (await browser.pages())[0];
      page.reload();
      await page.goto("http://localhost:45691");

      page.on("error", async (err) => {
        logger.error("error happen at the page: ", err);
        page.reload();
        await page.goto("http://localhost:45691");
      });

      page.on("pageerror", async (pageerr) => {
        logger.error("pageerror occurred: ", pageerr);
        page.reload();
        await page.goto("http://localhost:45691");
      });
    } catch {
      logger.error("Unable to launch browser, trying again...");
    }
  }, 15000);
}
