import pino from "pino";
import expressPino from "express-pino-logger";

const logger = pino({ level: process.env.NODE_ENV === "production" ? "error" : "debug" });

if (process.env.NODE_ENV !== "production") {
    logger.debug("Logging initialized at debug level");
}

export const expressLogger = expressPino({logger});

export default logger;