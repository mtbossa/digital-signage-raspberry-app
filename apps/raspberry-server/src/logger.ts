import { createLogger, format, Logger, transports } from "winston";

const logsFolder = "./logs";
let logger: Logger;

if (process.env.NODE_ENV === "development") {
  logger = createLogger({
    level: "debug",
    format: format.combine(format.splat(), format.simple()),
    transports: [
      new transports.Console(),
      new transports.File({
        filename: `${logsFolder}/errors.log`,
        level: "error",
      }),
    ],
  });
} else {
  logger = createLogger({
    level: "info",
    format: format.json(),
    transports: [
      new transports.Console(),
      new transports.File({
        filename: `${logsFolder}/errors.log`,
        level: "error",
      }),
    ],
  });
}

export default logger;
