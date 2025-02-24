import path from "path";
import { DataSource } from "typeorm";

import { config } from "./config";

export const appDataSource = new DataSource({
  type: "sqlite",
  database: path.join(__dirname, "/../../", config.DB_PATH),
  synchronize: true, // TODO: change it
  entities: [path.join(__dirname, '/../models/*.ts')],
});

export const initializeDatabase = async () => {
  try {
    await appDataSource.initialize();
  } catch (error) {
    // TODO: logging
    throw error;
  }
};
