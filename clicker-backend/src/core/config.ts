import { z } from "zod";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

const configSchema = z.object({
  TG_BOT_TOKEN: z.string(),
  ADMIN_TOKEN: z.string(),
  DB_PATH: z.string().default("db.sqlite"),
  PORT: z.number().default(3001),
});

const validationResult = configSchema.safeParse(process.env);

logger.info("Validating environment variables");

if (!validationResult.success) {
  throw new Error(`Environment validation failed: ${validationResult.error.toString()}`);
}

export const config = validationResult.data;
