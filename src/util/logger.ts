import pino from "pino";

const logger = pino({ level: process.env.NODE_ENV === "production" ? "error" : "debug" });

if (process.env.NODE_ENV !== "production") {
    logger.debug("Logging initialized at debug level");
}

export default logger;