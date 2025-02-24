import http from "http";
import "reflect-metadata";
import { Server } from "socket.io";

import { app } from "./adminServer/app";
import { bot } from "./bot/bot";
import { config } from "./core/config";
import { initializeDatabase } from "./core/database";
import { restoreFullEnergyBoostJob, rewardReferralsJob } from "./jobs";
import { initializeAppSettingsIfNotExists } from "./services/appSettingsService";
import { handleSocketConnection } from "./socket/socket";

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
  });

  restoreFullEnergyBoostJob.start();
  rewardReferralsJob.start();
};

main().catch(console.error);

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// TODO: look up needed
process.on("uncaughtException", console.log);
process.on("unhandledRejection", console.log);
