import { Task, User, AppSettings, League, Business } from "./models.js";
import { sendForAllUsers } from "./app.js";

export const getAppSettings = async () => {
  const appSettings = await AppSettings.find({}).populate("comboBusinesses");

  if (!appSettings.length || appSettings.length === 0) {
    console.error("[FATAL] App settings not found");
    return {};
  }

  return appSettings[0];
};

export const registerAdminRoutes = (router) => {
  router.get("/admin/settings", async (ctx) => {
    const settings = await getAppSettings();
    ctx.body = {
      ...settings.toObject(),
      comboBusinesses: settings.comboBusinesses.map((b) => b.toObject()),
    };
  });

  router.post("/admin/settings", async (ctx) => {
    let settings = await getAppSettings();
    const newSettings = ctx.request.body;

    settings.set(newSettings);

    // .energyPerSecond = newSettings.energyPerSecond;
    // settings.rewardPerClick = newSettings.rewardPerClick;
    // settings.fullEnergyBoostPerDay = newSettings.fullEnergyBoostPerDay;
    // settings.dailyReward = newSettings.dailyReward;
    // settings.referralReward = newSettings.referralReward;

    await settings.save();
    ctx.body = settings;
  });

  router.get("/admin/users", async (ctx) => {
    const { take, skip, balanceSort } = ctx.query;
    const users = await User.find()
      .sort({ balance: balanceSort === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(take);
    const usersCount = await User.countDocuments({});

    ctx.body = {
      data: users,
      skip,
      take,
      total: usersCount,
    };
  });

  router.get("/admin/users/:id", async (ctx) => {
    const user = await User.findById(ctx.params.id);
    ctx.body = user;
  });

  router.get("/admin/tasks", async (ctx) => {
    const filter = ctx.query.filter;
    let query = {};

    if (filter === "active") {
      query = { active: true };
    } else if (filter === "non-active") {
      query = { active: false };
    }

    const tasks = await Task.find(query);
    ctx.body = tasks.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      type: task.type,
      rewardAmount: task.rewardAmount,
      avatarUrl: task.avatarUrl,
      active: task.active,
    }));
  });

  router.post("/admin/tasks/:id/deactivate", async (ctx) => {
    const task = await Task.findById(ctx.params.id);
    task.active = false;
    await task.save();
    ctx.body = task;
  });

  router.post("/admin/tasks/:id/activate", async (ctx) => {
    const task = await Task.findById(ctx.params.id);
    task.active = true;
    await task.save();
    ctx.body = task;
  });

  router.post("/admin/tasks", async (ctx) => {
    console.log(ctx.request);
    const task = Task.create({
      name: ctx.request.body.name,
      type: ctx.request.body.type,
      activateUrl: ctx.request.body.activateUrl,
      description: ctx.request.body.description,
      rewardAmount: ctx.request.body.rewardAmount,
      avatarUrl: ctx.request.body.avatarUrl,
      active: true,
    });

    ctx.body = task;
  });

  router.get("/admin/tasks/:id", async (ctx) => {
    const task = await Task.findById(ctx.params.id);
    ctx.body = task;
  });

  router.put("/admin/tasks/:id", async (ctx) => {
    const task = await Task.findById(ctx.params.id);
    task.name = ctx.request.body.name;
    task.description = ctx.request.body.description;
    task.avatarUrl = ctx.request.body.avatarUrl;
    task.type = ctx.request.body.type;
    task.activateUrl = ctx.request.body.activateUrl;
    task.rewardAmount = ctx.request.body.rewardAmount;

    await task.save();

    ctx.body = task;
  });

  router.get("/admin/leagues", async (ctx) => {
    const leagues = await League.find({});
    ctx.body = leagues.map((l) => ({ id: l._id, ...l.toObject() }));
  });

  router.post("/admin/leagues", async (ctx) => {
    if (ctx.request.body.minScore > ctx.request.body.maxScore) {
      ctx.status = 400;
      ctx.body = "Min balance must be less than max balance";
      return;
    }

    const league = await League.create({
      name: ctx.request.body.name,
      description: ctx.request.body.description,
      avatarUrl: ctx.request.body.avatarUrl,
      minScore: ctx.request.body.minScore,
      maxScore: ctx.request.body.maxScore,
    });

    ctx.body = league;
  });

  router.delete("/admin/leagues/:id", async (ctx) => {
    const league = await League.findById(ctx.params.id);
    await league.remove();
  });

  router.get("/admin/leagues/:id", async (ctx) => {
    const league = await League.findById(ctx.params.id);
    ctx.body = league;
  });

  router.put("/admin/leagues/:id", async (ctx) => {
    const league = await League.findById(ctx.params.id);
    league.name = ctx.request.body.name;
    league.description = ctx.request.body.description;
    league.avatarUrl = ctx.request.body.avatarUrl;
    league.minScore = ctx.request.body.minScore;
    league.maxScore = ctx.request.body.maxScore;

    await league.save();

    ctx.body = league;
  });

  router.get("/admin/businesses", async (ctx) => {
    const businesses = await Business.find({ isDeleted: false });
    ctx.body = businesses.map((business) => ({
      id: business.id,
      ...business.toObject(),
    }));
  });

  router.get("/admin/businesses/:id", async (ctx) => {
    const business = await Business.findById(ctx.params.id);
    ctx.body = business;
  });

  router.post("/admin/businesses", async (ctx) => {
    const business = await Business.create({
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

    ctx.body = business;
  });

  router.delete("/admin/businesses/:id", async (ctx) => {
    const business = await Business.findById(ctx.params.id);
    business.isDeleted = true;
    await business.save();
  });

  router.put("/admin/businesses/:id", async (ctx) => {
    const business = await Business.findById(ctx.params.id);
    business.name = ctx.request.body.name;
    business.description = ctx.request.body.description;
    business.avatarUrl = ctx.request.body.avatarUrl;
    business.rewardPerHour = ctx.request.body.rewardPerHour;
    business.refsToUnlock = ctx.request.body.refsToUnlock;
    business.price = ctx.request.body.price;
    business.category = ctx.request.body.category;

    await business.save();

    ctx.body = business;
  });

  router.get("/admin/reset-users", async (ctx) => {
    await User.updateMany(
      {},
      {
        $set: {
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
        },
      }
    );
    ctx.body = "Users reset";
    return;
  });

  router.post("/admin/broadcast", async (ctx) => {
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
