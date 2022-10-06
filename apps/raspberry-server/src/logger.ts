import os from "os";
import path from "path";
import { createLogger, format, Logger, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

type AppEnv = "development" | "staging" | "production";
const APP_ENV: AppEnv = process.env.NODE_ENV as AppEnv;

let logger: Logger;

const myFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level}: ${message}`;
});

if (APP_ENV === "development") {
  const logsFolder = `${process.cwd()}/logs`;

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
        filename: `${logsFolder}/debug.log`,
        level: "debug",
      }),
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
    const dailyTransport: DailyRotateFile = new DailyRotateFile({
      filename: `${logsFolder}/daily_log-%DATE%.log`,
      datePattern: "HH",
      maxSize: "100m",
      level: "debug",
      format: format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: "YYYY-MM-DD hh:mm:ss" }),
        format.json()
      ),
      handleExceptions: true,
    });

    logger = createLogger({
      level: "debug",
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
        dailyTransport,
      ],
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
