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

      ctx.reply("Welcome").catch(() => {
        console.log("i don't know how its work");
      });

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
            const isPremium = ctx.from.is_premium;
            console.log(isPremium);
            if (isPremium) {
              refUser.balance += appSettings.premiumReferralReward;
            } else {
              refUser.balance += appSettings.referralReward;
            }
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
    const settings = await getAppSettings();
    ctx.body = { ...settings.toObject() };
    return;
  });

  router.post("/wallet-address", async (ctx) => {
    const { walletAddress, userTgId } = ctx.request.body;
    const user = await User.findOne({ tgId: userTgId });

    if (!user) {
      return;
    }

    user.connectedWallet = walletAddress;
    await user.save();
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

  socketServer.on("disconnect", async () => {
    const tgUserId = Number(socketServer.userId);

    await User.findOneAndUpdate(
      { tgId: tgUserId },
      { lastOnlineTimestamp: new Date().getTime() }
    );
  });

  ensureAppSettings();
  runEnergyRecover();
  runBusinesses();
  runCombos();

  const port = 3001;
  server.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
  });
};
main();

async function ensureAppSettings() {
  try {
    const appSettings = await AppSettings.findOne({});
    if (appSettings) {
      return appSettings;
    }

    const newAppSettings = new AppSettings({
      energyPerSecond: 1,
      rewardPerClick: 1,
      fullEnergyBoostPerDay: 1,
      dailyReward: 1,
      referralReward: 1,
      maxClickLevel: 1,
      startClickUpgradeCost: 1,
      premiumReferralReward: 1,
      maxEnergyLevel: 1,
      startEnergyUpgradeCost: 1,
      comboReward: 1,
      comboUpdateDayHour: 0,
      lastComboUpdateTimestamp: 0,
    });

    await newAppSettings.save();
    return newAppSettings;
  } catch (error) {
    console.error("Error ensuring app settings:", error);
    throw error;
  }
}
