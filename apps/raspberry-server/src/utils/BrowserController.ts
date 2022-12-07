import puppeteer, { Browser, Page } from "puppeteer-core";

import logger from "../logger";

export default class BrowserController {
  static browser: Browser | null = null;
  static appPage: Page | null = null;
  // Since we don't have access to app, we must hardcode the port
  static appPort = 45691;

  static async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  static async startApp() {
    if (BrowserController.browser) {
      await BrowserController.browser.close();
    }

    BrowserController.browser = await BrowserController.launchBrowser();
    await BrowserController.openAppPage();
  }

  private static async handlePageErrors(error: any, errorType: "error" | "pageerror") {
    logger.error(`error (${errorType}) happen at the page: `, error);
    BrowserController.startApp();
  }

  private static async openAppPage() {
    if (!BrowserController.browser) {
      BrowserController.startApp();
      return;
    }

    BrowserController.appPage = await BrowserController.browser.newPage();

    try {
      await BrowserController.appPage.goto(
        `http://localhost:${BrowserController.appPort}`
      );
    } catch (e) {
      BrowserController.startApp();
      return;
    }

    BrowserController.appPage.on("error", (err) => {
      BrowserController.handlePageErrors(err, "error");
    });

    BrowserController.appPage.on("pageerror", async (pageerr) => {
      BrowserController.handlePageErrors(pageerr, "pageerror");
    });
  }

  private static launchBrowser(): Promise<Browser> {
    // When on Windows, must set the chrome.exe path to the PATH env variable
    const chromePath = process.env.CHROME_PATH ?? "/usr/bin/chromium-browser";
    return new Promise((resolve) => {
      let browser: Browser | null = null;

      const interval = setInterval(async () => {
        try {
          // In order to avoid any double browser instances, since we're using setInterval(),
          // we check if it has been instantiated and return it.
          if (browser) {
            clearInterval(interval);
            resolve(browser);
            return;
          }

          browser = await puppeteer.launch({
            headless: false,
            executablePath: chromePath,
            args: ["--kiosk", "--ingonito"],
            ignoreDefaultArgs: ["--enable-automation", "--disable-extensions"],
            timeout: 10000,
            defaultViewport: null,
          });

          clearInterval(interval);
          resolve(browser);
          return;
        } catch (e) {
          logger.error("Unable to launch browser, trying again...");
        }
      }, 15000);
    });
  }
}
