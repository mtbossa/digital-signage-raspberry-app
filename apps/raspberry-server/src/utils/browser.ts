import puppeteer, { Browser, Page } from "puppeteer-core";

import logger from "../logger";

class BrowserController {
  browser: Browser | null = null;
  appPage: Page | null = null;

  public async startApp() {
    if (this.browser) {
      this.browser.close();
    }

    this.browser = await this.launchBrowser();
    await this.openAppPage();
  }

  private async handlePageErrors(error: any, errorType: "error" | "pageerror") {
    logger.error(`error (${errorType}) happen at the page: `, error);
    this.startApp();
  }

  public async openAppPage() {
    if (!this.browser) {
      this.startApp();
      return;
    }

    this.appPage = await this.browser.newPage();
    this.appPage.goto("http://localhost:45691");

    this.appPage.on("error", (err) => {
      this.handlePageErrors(err, "error");
    });

    this.appPage.on("pageerror", async (pageerr) => {
      this.handlePageErrors(pageerr, "pageerror");
    });
  }

  public async launchBrowser(): Promise<Browser> {
    // When on Windows, must set the chrome.exe path to the PATH env variable
    const chromePath = process.env.CHROME_PATH ?? "/usr/bin/chromium-browser";
    return new Promise((resolve) => {
      let browser: Browser | null = null;

      const interval = setInterval(async () => {
        try {
          if (browser) {
            clearInterval(interval);
            resolve(browser);
          }

          browser = await puppeteer.launch({
            headless: false,
            executablePath: chromePath,
            args: ["--kiosk", "--ingonito"],
            ignoreDefaultArgs: ["--enable-automation", "--disable-extensions"],
            timeout: 10000,
            defaultViewport: null,
          });
        } catch (e) {
          logger.error("Unable to launch browser, trying again...");
        }
      }, 15000);
    });
  }
}

export default async function startApp() {
  const browserController = new BrowserController();
  await browserController.startApp();
  return browserController;
}
