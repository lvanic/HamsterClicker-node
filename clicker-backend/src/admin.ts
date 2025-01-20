import { DefaultState, DefaultContext } from "koa";
import Router from "@koa/router";
import { sendForAllUsers } from "./services/botService";
import { appDataSource } from "./core/database";
import { AppSettings } from "./models/appSettings";
import { User } from "./models/user";
import { Task } from "./models/task";
import { League } from "./models/league";
import { Business } from "./models/business";

export const getAppSettings = async (): Promise<AppSettings> => {
  const appSettings = await appDataSource.getRepository(AppSettings).find({ relations: ["comboBusinesses"] });

  if (!appSettings.length || appSettings.length === 0) {
    console.error("[FATAL] App settings not found");
    throw new Error("");
  }

  return appSettings[0];
};

export const registerAdminRoutes = (router: Router<DefaultState, DefaultContext>) => {
  router.get("/admin/settings", async (ctx: { body: any; }) => {
    const settings = await getAppSettings();
    ctx.body = {
      ...settings,
      comboBusinesses: settings.comboBusinesses,
    };
  });

  router.post("/admin/settings", async (ctx: { request: { body: any; }; body: any; }) => {
    let settings = await getAppSettings();
    const newSettings = ctx.request.body;

    Object.assign(settings, newSettings);

    // .energyPerSecond = newSettings.energyPerSecond;
    // settings.rewardPerClick = newSettings.rewardPerClick;
    // settings.fullEnergyBoostPerDay = newSettings.fullEnergyBoostPerDay;
    // settings.dailyReward = newSettings.dailyReward;
    // settings.referralReward = newSettings.referralReward;

    await appDataSource.getRepository(AppSettings).save(settings);
    ctx.body = settings;
  });

  router.get("/admin/users", async (ctx: { query: { take: any; skip: any; balanceSort: any; }; body: { data: any; skip: any; take: any; total: any; }; }) => {
    const { take, skip, balanceSort } = ctx.query;
    const users = await appDataSource.getRepository(User)
      .createQueryBuilder("user")
      .orderBy("user.balance", balanceSort === "desc" ? "DESC" : "ASC")
      .skip(skip)
      .take(take)
      .getMany();

    const usersCount = await appDataSource.getRepository(User).count();

    ctx.body = {
      data: users,
      skip,
      take,
      total: usersCount,
    };
  });

  router.get("/admin/users/:id", async (ctx: { params: { id: any; }; body: any; }) => {
    const user = await appDataSource.getRepository(User).findOne(ctx.params.id);
    ctx.body = user;
  });

  router.get("/admin/tasks", async (ctx: { query: any[]; body: any; }) => {
    const filter = ctx.query.filter as unknown as string;
    let query = {};

    if (filter === "active") {
      query = { active: true };
    } else if (filter === "non-active") {
      query = { active: false };
    }

    const tasks = await appDataSource.getRepository(Task).find({ where: query });
    ctx.body = tasks.map((task: { id: any; name: any; description: any; type: any; rewardAmount: any; avatarUrl: any; active: any; }) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      type: task.type,
      rewardAmount: task.rewardAmount,
      avatarUrl: task.avatarUrl,
      active: task.active,
    }));
  });

  router.post("/admin/tasks/:id/deactivate", async (ctx: { params: { id: any; }; body: any; }) => {
    const task = await appDataSource.getRepository(Task).findOneOrFail(ctx.params.id);
    task.active = false;
    await appDataSource.getRepository(Task).save(task);
    ctx.body = task;
  });

  router.post("/admin/tasks/:id/activate", async (ctx: { params: { id: any; }; body: any; }) => {
    const task = await appDataSource.getRepository(Task).findOneOrFail(ctx.params.id);
    task.active = true;
    await appDataSource.getRepository(Task).save(task);
    ctx.body = task;
  });

  router.post("/admin/tasks", async (ctx: { request: { body: { name: any; type: any; activateUrl: any; description: any; rewardAmount: any; avatarUrl: any; }; }; body: any; }) => {
    const task = await appDataSource.getRepository(Task).create({
      name: ctx.request.body.name,
      type: ctx.request.body.type,
      activateUrl: ctx.request.body.activateUrl,
      description: ctx.request.body.description,
      rewardAmount: ctx.request.body.rewardAmount,
      avatarUrl: ctx.request.body.avatarUrl,
      active: true,
    });

    await appDataSource.getRepository(Task).save(task);

    ctx.body = task;
  });

  router.get("/admin/tasks/:id", async (ctx: { params: { id: any; }; body: any; }) => {
    const task = await appDataSource.getRepository(Task).findOneOrFail(ctx.params.id);
    ctx.body = task;
  });

  router.put("/admin/tasks/:id", async (ctx: { params: { id: any; }; request: { body: { name: any; description: any; avatarUrl: any; type: any; activateUrl: any; rewardAmount: any; }; }; body: any; }) => {
    const task = await appDataSource.getRepository(Task).findOneOrFail(ctx.params.id);
    task.name = ctx.request.body.name;
    task.description = ctx.request.body.description;
    task.avatarUrl = ctx.request.body.avatarUrl;
    task.type = ctx.request.body.type;
    task.activateUrl = ctx.request.body.activateUrl;
    task.rewardAmount = ctx.request.body.rewardAmount;

    await appDataSource.getRepository(Task).save(task);

    ctx.body = task;
  });

  router.get("/admin/leagues", async (ctx: { body: any; }) => {
    const leagues = await appDataSource.getRepository(League).find();
    ctx.body = leagues;
  });

  router.post("/admin/leagues", async (ctx: { request: { body: { minScore: number; maxScore: number; name: any; description: any; avatarUrl: any; }; }; status: number; body: string; }) => {
    if (ctx.request.body.minScore > ctx.request.body.maxScore) {
      ctx.status = 400;
      ctx.body = "Min balance must be less than max balance";
      return;
    }

    const league = await appDataSource.getRepository(League).create({
      name: ctx.request.body.name,
      description: ctx.request.body.description,
      avatarUrl: ctx.request.body.avatarUrl,
      minScore: ctx.request.body.minScore,
      maxScore: ctx.request.body.maxScore,
    });

    await appDataSource.getRepository(League).save(league);

    ctx.body = JSON.stringify(league);
  });

  router.delete("/admin/leagues/:id", async (ctx: { params: { id: any; }; }) => {
    const league = await appDataSource.getRepository(League).findOneOrFail(ctx.params.id);
    await appDataSource.getRepository(League).remove(league);
  });

  router.get("/admin/leagues/:id", async (ctx: { params: { id: any; }; body: any; }) => {
    const league = await appDataSource.getRepository(League).findOneOrFail(ctx.params.id);
    ctx.body = league;
  });

  router.put("/admin/leagues/:id", async (ctx: { params: { id: any; }; request: { body: { name: any; description: any; avatarUrl: any; minScore: any; maxScore: any; }; }; body: any; }) => {
    const league = await appDataSource.getRepository(League).findOneOrFail(ctx.params.id);
    league.name = ctx.request.body.name;
    league.description = ctx.request.body.description;
    league.avatarUrl = ctx.request.body.avatarUrl;
    league.minScore = ctx.request.body.minScore;
    league.maxScore = ctx.request.body.maxScore;

    await appDataSource.getRepository(League).save(league);

    ctx.body = league;
  });

  router.get("/admin/businesses", async (ctx: { body: any; }) => {
    const businesses = await appDataSource.getRepository(Business).find({
      where: {
        isDeleted: false
      }
    });
    ctx.body = businesses;
  });

  router.get("/admin/businesses/:id", async (ctx: { params: { id: any; }; body: any; }) => {
    const business = await appDataSource.getRepository(Business).findOneOrFail(ctx.params.id);
    ctx.body = business;
  });

  router.post("/admin/businesses", async (ctx: { request: { body: { name: any; description: any; avatarUrl: any; rewardPerHour: any; refsToUnlock: any; price: any; category: any; }; }; body: any; }) => {
    const business = await appDataSource.getRepository(Business).create({
      name: ctx.request.body.name,
      description: ctx.request.body.description,
      avatarUrl: ctx.request.body.avatarUrl,
      rewardPerHour: ctx.request.body.rewardPerHour,
      refsToUnlock: ctx.request.body.refsToUnlock
        ? ctx.request.body.refsToUnlock
        : 0,
      price: ctx.request.body.price,
      category: ctx.request.body.category,
      isDeleted: false,
    });

    await appDataSource.getRepository(Business).save(business);

    ctx.body = business;
  });

  router.delete("/admin/businesses/:id", async (ctx: { params: { id: any; }; }) => {
    const business = await appDataSource.getRepository(Business).findOneOrFail(ctx.params.id);
    business.isDeleted = true;
    await appDataSource.getRepository(Business).save(business);
  });

  router.put("/admin/businesses/:id", async (ctx: { params: { id: any; }; request: { body: { name: any; description: any; avatarUrl: any; rewardPerHour: any; refsToUnlock: any; price: any; category: any; }; }; body: any; }) => {
    const business = await appDataSource.getRepository(Business).findOneOrFail(ctx.params.id);
    business.name = ctx.request.body.name;
    business.description = ctx.request.body.description;
    business.avatarUrl = ctx.request.body.avatarUrl;
    business.rewardPerHour = ctx.request.body.rewardPerHour;
    business.refsToUnlock = ctx.request.body.refsToUnlock;
    business.price = ctx.request.body.price;
    business.category = ctx.request.body.category;

    await appDataSource.getRepository(Business).save(business);

    ctx.body = business;
  });

  router.get("/admin/reset-users", async (ctx: { body: string; }) => {
    await appDataSource.getRepository(User)
      .createQueryBuilder()
      .update()
      .set({
        addedFromBusinesses: 0,
        balance: 0,
        score: 0,
        energy: 1000,
        clickPower: 1,
        energyLevel: 1,
        currentComboCompletions: [],
        completedTasks: [],
        businesses: [],
        businessUpgrades: [],
      })
      .execute();
    ctx.body = "Users reset";
    return;
  });

  router.post("/admin/broadcast", async (ctx: { request: { body: { message: any; }; }; status: number; body: string; }) => {
    const { message } = ctx.request.body;

    if (!message) {
      ctx.status = 400;
      ctx.body = "Message is required";
      return;
    }

    try {
      await sendForAllUsers(message);
      ctx.status = 200;
      ctx.body = "Broadcast message sent";
    } catch (error) {
      console.error("Error during broadcasting:", error);
      ctx.status = 500;
      ctx.body = "Internal Server Error";
    }
  });
};
