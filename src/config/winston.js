import winston, { format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

const logger = winston.createLogger({
  level: "info", // default level
  format: logFormat,
  transports: [
    // Combined logs (info and above)
    new DailyRotateFile({
      filename: "./logs/app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m", // Rotate every 20 MB
      maxFiles: "30d", // Keep logs for 30 days
      level: "info",
    }),

    // Error logs only
    new DailyRotateFile({
      filename: "./logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "10m",
      maxFiles: "30d",
      level: "error",
    }),
  ],
  exitOnError: false, // don't exit on handled exceptions
});

// Log to console only in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

// Stream for Morgan (HTTP logging)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export default logger;
