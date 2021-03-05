
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

export const BUCKET_NAME: string = process.env["BUCKET_NAME"] ?? "";
if (!BUCKET_NAME) {
    logger.error("No bucket name specified. Please set BUCKET_NAME env variable");
    process.exit(1);
}

export const AWS_KEY: string = process.env["AWS_KEY"] ?? "";
if (!AWS_KEY) {
    logger.error("No aws key specified. Please set AWS_KEY env variable");
    process.exit(1);
}

export const AWS_SECRET: string = process.env["AWS_SECRET"] ?? "";
if (!AWS_SECRET) {
    logger.error("No aws secret specified. Please set AWS_SECRET env variable");
    process.exit(1);
}

export const BUCKET_REGION: string = process.env["BUCKET_REGION"] ?? "";
if (!BUCKET_REGION) {
    logger.error("No bucket region specified. Please set BUCKET_REGION env variable");
    process.exit(1);
}

export const SENDGRID_API_KEY: string = process.env["SENDGRID_API_KEY"] ?? "";
if (!SENDGRID_API_KEY) {
    logger.error("No sendgrid API key specified. Please set SENDGRID_API_KEY env variable");
    process.exit(1);
}

export const HOSTNAME: string = process.env["HOSTNAME"] ?? "";
if (!HOSTNAME) {
    logger.error("No hostname defined to use for email. Please set HOSTNAME env variable");
    process.exit(1);
}