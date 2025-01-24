import http from "http";
import "reflect-metadata";
import { Server } from "socket.io";
import { handleSocketConnection } from "./socket/socket";
import { runCombos } from "./jobs";
import { bot } from "./bot/bot";
import { initializeDatabase } from "./core/database";
import { app } from "./app/app";
import { initializeAppSettingsIfNotExists } from "./services/appSettingsService";

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

  runCombos();

  const port = 3001;
  server.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
  });
};

main().catch(console.error)

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// TODO: look up needed
process.on("uncaughtException", console.log);
process.on("unhandledRejection", console.log);