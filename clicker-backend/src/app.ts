import http from "http";
import "reflect-metadata";
import { Server } from "socket.io";

import { app } from "./adminServer/app";
import { bot } from "./bot/bot";
import { config } from "./core/config";
import { initializeDatabase } from "./core/database";
import logger from "./core/logger";
import { restoreFullEnergyBoostJob, rewardReferralsJob } from "./jobs";
import { initializeAppSettingsIfNotExists } from "./services/appSettingsService";
import { handleSocketConnection } from "./socket/socket";
import { AccountSubscription } from "./ton/AccountSubscription";
import { startTonMonitor, stopTonMonitor } from "./ton/monitor";

const main = async () => {
  await initializeDatabase();
  await initializeAppSettingsIfNotExists();

  bot.launch();

  const server = http.createServer(app.callback());
  const socketServer = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  socketServer.on("connection", handleSocketConnection);

  server.listen(config.PORT, () => {
    logger.info(`Server is running on http://localhost:${config.PORT}`);
  });

  restoreFullEnergyBoostJob.start();
  rewardReferralsJob.start();

  startTonMonitor();
};

main().catch((error) => logger.error("Unexpected error", error));

// Enable graceful stop
process.once("SIGINT", () => {
  stopTonMonitor();
  bot.stop("SIGINT");
});
process.once("SIGTERM", () => {
  stopTonMonitor();
  bot.stop("SIGTERM");
});

// TODO: look up needed
process.on("uncaughtException", (error) => logger.error("Uncaught exception", error));
process.on("unhandledRejection", (error) => logger.error("Uncaught rejection", error));
