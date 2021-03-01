  
import logger from "./logger";
import dotenv from "dotenv";

export const ENVIRONMENT: string = process.env.NODE_ENV ?? "";

if (ENVIRONMENT !== "production") {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
}

export const MONGODB_URI: string = process.env["MONGODB_URI"] ?? "";

if (!MONGODB_URI) {
    logger.error("No mongo connection string. Set MONGODB_URI environment variable.");
    process.exit(1);
}


// Used as bcrypt salt
// Defaults to 10 if not defined in .env
export const SALT_ROUNDS: number = parseInt(process.env["SALT_ROUNDS"] || "10"); 

export const JWT_SECRET: string = process.env["JWT_SECRET"] ?? "";

if (!JWT_SECRET) {
    logger.error("No JWT secret specific. Set JWT_SECRET environment variable.");
    process.exit(1);
}