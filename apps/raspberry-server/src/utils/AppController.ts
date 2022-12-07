import logger from "../logger";
import BrowserController from "./BrowserController";
import { ExitCodes } from "./errors/exit-codes.enum";

export async function restartApp() {
  if (BrowserController.browser) {
    await BrowserController.closeBrowser();
  }

  setTimeout(function () {
    process.on("exit", function (code: 0 | ExitCodes) {
      if (code === ExitCodes.DataCorruption) {
        logger.error("Exiting because of data corruption");
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("child_process").spawn(process.argv.shift(), process.argv, {
          cwd: process.cwd(),
          detached: true,
          stdio: "inherit",
        });
      }
    });
    process.exit(ExitCodes.DataCorruption);
  }, 5000);
}
