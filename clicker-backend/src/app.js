import Koa from "koa";
import Router from "@koa/router";
import http from "http";
import cors from "@koa/cors";
import { Telegraf } from "telegraf";
import { Server } from "socket.io";
import { registerAdminRoutes } from "./admin.js";
import { handleSocketConnection } from "./sockets.js";
import { mongoose } from "mongoose";
import { runEnergyRecover, runBusinesses, runCombos } from "./jobs.js";
import dotenv from "dotenv";
import { getAppSettings } from "./admin.js";
import { User, AppSettings } from "./models.js";
import bodyParser from "koa-bodyparser";

dotenv.config();

let config = process.env;
export const bot = new Telegraf(config.TG_BOT_TOKEN);

const main = async () => {
  bot.start(async (ctx) => {
    try {
      const [, refId] = ctx.message.text.split("ref_");
      const tgUserId = ctx.message.chat.id;
      console.log({ refId, tgUserId });
      ctx.reply("Welcome");
      const existingUser = await User.findOne({ tgId: tgUserId });
      if (!existingUser) {
        const user = new User({
          tgId: tgUserId,
          tgUsername: ctx.message.from.username,
          firstName: ctx.message.from.first_name,
          lastName: ctx.message.from.last_name,
          balance: 0,
          score: 0,
          energy: 1000,
          maxEnergy: 1000,
          clickPower: 1,
          energyLevel: 1,
          addedFromBusinesses: 0,
        });

        if (!!refId) {
          const refUser = await User.findOne({ tgId: refId });
          if (refUser) {
            const appSettings = await getAppSettings();
            refUser.referrals.push(user);
            refUser.balance += appSettings.referralReward;
            await refUser.save();
          }
        }

        await user.save();
      }
    } catch (e) {
      console.log(e);
    }
  });

  bot.launch();
  await mongoose.connect(config.MONGO_DB);

  const appSettings = await AppSettings.find({});
  if (!appSettings.length || appSettings.length === 0) {
    const appSettings = new AppSettings({
      energyPerSecond: 0.2,
      rewardPerClick: 1,
      fullEnergyBoostPerDay: 3,
      dailyReward: 50,
      referralReward: 500,
    });

    await appSettings.save();
  }

  const app = new Koa();
  const router = new Router();
  registerAdminRoutes(router);

  router.get("/app-settings", async (ctx) => {
    ctx.body = await getAppSettings();
  });

  router.post("/wallet-address", async (ctx) => {
    const { walletAddress, userTgId } = ctx.request.body;
    const user = await User.findOne({ tgId: userTgId });
    if (!user) {
      return;
    }

    user.connectedWallet = walletAddress;
    await user.save();
  });

  app.use(cors());
  app.use(bodyParser());
  app.use(router.routes()).use(router.allowedMethods());
  app.use(async (ctx, next) => {
    if (ctx.path.startsWith("/admin")) {
      const token = ctx.headers["AdminToken"];
      if (token === config.ADMIN_TOKEN) {
        await next();
      } else {
        ctx.status = 401;
        ctx.body = "Unauthorized";
      }
    }
  });

  const server = http.createServer(app.callback());
  const socketServer = new Server(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  socketServer.on("connection", handleSocketConnection);

  socketServer.on("disconnect", () => {
    console.log("Пользователь отключен от WebSocket");
  });

  runEnergyRecover();
  runBusinesses();
  runCombos();

  const port = 3001;
  server.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
  });
};
main();
