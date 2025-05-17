import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const configSchema = z.object({
  TG_BOT_TOKEN: z.string(),
  ADMIN_TOKEN: z.string(),
  DB_PATH: z.string().default("db.sqlite"),
  PORT: z.string().transform((val) => Number(val)).default("3001"),
  NODE_ENV: z.string().default("development"),
  WEB_APP_URL: z.string(),
  CHAN_URL: z.string(),
  TON_WALLET_ADDRESS: z.string(),
  TONCENTER_API_KEY: z.string(),
});

const validationResult = configSchema.safeParse(process.env);

if (!validationResult.success) {
  throw new Error(`Environment validation failed: ${validationResult.error.toString()}`);
}

export const config = validationResult.data;
