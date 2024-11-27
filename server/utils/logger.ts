import {createLogger, format, transports} from "winston";

const {colorize, combine, errors, json, printf, splat, timestamp} = format;

const logger = createLogger({
  level: "info",
  format: combine(
    timestamp(),
    errors({stack: true}),
    splat(),
    json(),
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        printf(({level, message, timestamp, stack}) => {
          return `${timestamp} [${level}]: ${message} ${stack ? stack : ""}`;
        }),
      ),
    }),
    new transports.File({filename: "logs/error.log", level: "error"}),
    new transports.File({filename: "logs/combined.log"}),
  ],
});

export default logger;