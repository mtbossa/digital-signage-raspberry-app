import os from "os";
import path from "path";
import { createLogger, format, Logger, transports } from "winston";

type AppEnv = "development" | "staging" | "production";
const APP_ENV: AppEnv = process.env.NODE_ENV as AppEnv;

let logger: Logger;

const myFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level}: ${message}`;
});

if (APP_ENV === "development") {
  const logsFolder = "./logs";

  logger = createLogger({
    level: "debug",
    format: format.combine(
      format.errors({ stack: true }),
      format.timestamp({ format: "YYYY-MM-DD hh:mm:ss" }),
      format.colorize(),
      format.align(),
      myFormat
    ),
    transports: [
      new transports.Console({ handleExceptions: true }),
      new transports.File({
        filename: `${logsFolder}/errors.log`,
        level: "error",
      }),
    ],
    exceptionHandlers: [
      new transports.File({ filename: `${logsFolder}/exceptions.log` }),
    ],
    exitOnError: false,
  });
} else {
  const userHomeDir = os.homedir();
  const logsFolder = path.join(userHomeDir, ".local/", "share/", "intus/logs");

  if (APP_ENV === "staging") {
    logger = createLogger({
      level: "info",
      format: format.combine(format.errors({ stack: true }), format.json()),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.timestamp({ format: "YYYY-MM-DD hh:mm:ss" })
          ),
          handleExceptions: true,
        }),
        new transports.File({
          filename: `${logsFolder}/errors.log`,
          level: "error",
          format: format.combine(
            format.errors({ stack: true }),
            format.timestamp({ format: "YYYY-MM-DD hh:mm:ss" }),
            format.json()
          ),
        }),
      ],
      exceptionHandlers: [
        new transports.File({
          filename: `${logsFolder}/exceptions.log`,
          format: format.combine(
            format.errors({ stack: true }),
            format.timestamp({ format: "YYYY-MM-DD hh:mm:ss" }),
            format.json()
          ),
        }),
      ],
      exitOnError: false,
    });
  } else {
    logger = createLogger({
      level: "error",
      format: format.combine(format.errors({ stack: true }), format.json()),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.timestamp({ format: "YYYY-MM-DD hh:mm:ss" })
          ),
          handleExceptions: true,
        }),
      ],
    });
  }
}

export default logger;
