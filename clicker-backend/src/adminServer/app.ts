import Koa from "koa";
import Router from "@koa/router";
import { getAppSettings } from "../services/appSettingsService";
import { findUserByTgId, updateUserByTgId } from "../services/userService";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import { config } from "../core/config";
import adminRoutes from "./routes/adminRoutes";
import TonWeb from "tonweb";
import { createPayment } from "../services/paymentService";

export const app = new Koa();
const router = new Router();

router.use(adminRoutes.routes());

router.get("/app-settings", async (ctx) => {
  const settings = await getAppSettings();
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
    if (token === (config.ADMIN_TOKEN || "admin")) {
      await next();
    } else {
      ctx.status = 401;
      ctx.body = "Unauthorized";
      return;
    }
  } else {
    await next();
  }
});


router.post("/payments/create", async (ctx) => {
  const { serviceType, userId } = ctx.request.body as {
    serviceType: string;
    userId: number;
  };

  if (!["boost_x2", "handicap"].includes(serviceType)) {
    ctx.throw(400, "Invalid service type");
  }

  const price = serviceType === "boost_x2" ? "0.3" : "1.5";
  const amount = TonWeb.utils.toNano(price).toString();

  const uuid = await createPayment(Number(amount), serviceType as any, userId);

  ctx.body = {
    uuid,
    amount,
  };
});

app.use(router.routes()).use(router.allowedMethods());
