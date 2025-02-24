import Koa from "koa";
import Router from "@koa/router";
import { getAppSettingsWithBusinesses } from "../services/appSettingsService";
import { findUserByTgId, updateUserByTgId } from "../services/userService";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import { config } from "../core/config";
import adminRoutes from "./routes/adminRoutes";

export const app = new Koa();
const router = new Router();

router.use(adminRoutes.routes());

router.get("/app-settings", async (ctx) => {
  const settings = await getAppSettingsWithBusinesses();
  ctx.body = { ...settings };
  return;
});

router.post("/wallet-address", async (ctx) => {
  const { walletAddress, userTgId } = ctx.request.body as { walletAddress: string; userTgId: number };
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
