import Koa from "koa";
import Router from "@koa/router";
import http from "http";
import cors from "@koa/cors";
import "reflect-metadata";
import { Server } from "socket.io";
import { registerAdminRoutes } from "./admin";
import { handleSocketConnection } from "./sockets";
import { runEnergyRecover, runBusinesses, runCombos } from "./jobs";
import bodyParser from "koa-bodyparser";
import { config } from "./core/config";
import { bot } from "./bot";
import { getAppSettingsWithBusinesses, initializeAppSettingsIfNotExists } from "./services/appSettingsService";
import { findUserByTgId, updateUserByTgId } from "./services/userService";
import { initializeDatabase } from "./core/database";

const main = async () => {
  const processError = (e: Error) => {
    console.log(e);
  };

  process.on("uncaughtException", processError);
  process.on("unhandledRejection", processError);

  await initializeDatabase();
  await initializeAppSettingsIfNotExists();

  const app = new Koa();
  const router = new Router();
  registerAdminRoutes(router);

  router.get("/app-settings", async (ctx) => {
    const settings = await getAppSettingsWithBusinesses();
    ctx.body = { ...settings };
    return;
  });

  router.post("/wallet-address", async (ctx) => {
    const { walletAddress, userTgId } = ctx.request.body as { walletAddress: string, userTgId: number};
    const user = await findUserByTgId(userTgId);

    if (!user) {
      return;
    }

    user.connectedWallet = walletAddress;
    await updateUserByTgId(userTgId, user);
    ctx.body = "ok";
  });

  app.use(bodyParser());

  app.use(cors());
  app.use(async (ctx, next) => {
    if (ctx.path.startsWith("/admin")) {
      const token = ctx.headers["admin-token"];
      console.log(token, config.ADMIN_TOKEN);

      if (token === (config.ADMIN_TOKEN || "admin")) {
        await next();
      } else {
        console.log("Unauthorized");

        ctx.status = 401;
        ctx.body = "Unauthorized";
        return;
      }
    } else {
      await next();
    }
  });

  app.use(router.routes()).use(router.allowedMethods());

  const server = http.createServer(app.callback());
  const socketServer = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  socketServer.on("connection", handleSocketConnection);

  runEnergyRecover();
  runBusinesses();
  runCombos();

  const port = 3001;
  server.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
  });
};
try {
  main();
} catch (e) {
  console.log(e);
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))