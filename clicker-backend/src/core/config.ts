import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();


const configSchema = z.object({
  TG_BOT_TOKEN: z.string(),
  ADMIN_TOKEN: z.string(),
  MONGO_DB: z.string(),
});

const validationResult = configSchema.safeParse(process.env);

if (!validationResult.success) {
  throw new Error(`Environment validation failed: ${validationResult.error.format()}`);
}

export const config = validationResult.data;
