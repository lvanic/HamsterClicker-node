import path from "path";
import { DataSource } from "typeorm";

import { config } from "./config";
import logger from "./logger";

export const appDataSource = new DataSource({
  type: "sqlite",
  database: path.join(__dirname, "/../../", config.DB_PATH),
  synchronize: true, // TODO: change it
  entities: [path.join(__dirname, "/../models/*.ts")],
  logging: true,
  logger: "file",
});

export const initializeDatabase = async () => {
  try {
    logger.info("Initializing database");

    await appDataSource.initialize();
  } catch (error) {
    logger.error("Error during database initialization");

    throw error;
  }
};
