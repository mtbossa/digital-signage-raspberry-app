import { createLogger, format, Logger, transports } from "winston";

let logger: Logger;

const myFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level}: ${message}`;
});

if (process.env.NODE_ENV === "development") {
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
  const logsFolder = `/usr/share/intus/logs`;
  logger = createLogger({
    level: "info",
    format: format.combine(format.errors({ stack: true }), format.json()),
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
        handleExceptions: true,
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
}

export default logger;
