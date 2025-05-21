import { Context } from "koa";
import * as AppSettingsService from "../../services/appSettingsService";
import { appDataSource } from "../../core/database";
import { AppSettings } from "../../models/appSettings";
import { User } from "../../models/user";
import { sendForAllUsers } from "../../services/botService";
import { Task } from "../../models/task";
import { Business } from "../../models/business";
import { findUserByTgId } from "../../services/userService";
import logger from "../../core/logger";
import { broadcastSend } from "../../app";

export const getAppSettings = async (ctx: Context) => {
  const settings = await AppSettingsService.getAppSettings();
  ctx.body = settings;
};

export const updateAppSettings = async (ctx: Context) => {
  let settings = await AppSettingsService.getAppSettings();
  const newSettings = ctx.request.body;

  Object.assign(settings, newSettings);

  await appDataSource.getRepository(AppSettings).save(settings);
  ctx.body = settings;
};

export const getUsers = async (ctx: {
  query: { take: any; skip: any; balanceSort: any };
  body: { data: any; skip: any; take: any; total: any };
}) => {
  const { take, skip, balanceSort } = ctx.query;
  const users = await appDataSource
    .getRepository(User)
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
};

export const getUserById = async (ctx: Context) => {
  const user = await findUserByTgId(ctx.params.id);
  ctx.body = user;
};

export const getTasks = async (ctx: Context) => {
  const filter = ctx.query.filter as unknown as string;
  let query = {};

  if (filter === "active") {
    query = { active: true };
  } else if (filter === "non-active") {
    query = { active: false };
  }

  const tasks = await appDataSource.getRepository(Task).find({ where: query });
  ctx.body = tasks.map(
    (task: { id: any; name: any; description: any; type: any; rewardAmount: any; avatarUrl: any; active: any }) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      type: task.type,
      rewardAmount: task.rewardAmount,
      avatarUrl: task.avatarUrl,
      active: task.active,
    }),
  );
};

export const deactivateTask = async (ctx: { params: { id: any }; body: any }) => {
  const task = await appDataSource.getRepository(Task).findOneOrFail(ctx.params.id);
  task.active = false;
  await appDataSource.getRepository(Task).save(task);
  ctx.body = task;
};

export const activateTask = async (ctx: { params: { id: any }; body: any }) => {
  const task = await appDataSource.getRepository(Task).findOneOrFail(ctx.params.id);
  task.active = true;
  await appDataSource.getRepository(Task).save(task);
  ctx.body = task;
};

export const addTask = async (ctx: {
  request: { body: { name: any; type: any; activateUrl: any; description: any; rewardAmount: any; avatarUrl: any } };
  body: any;
}) => {
  const task = await appDataSource.getRepository(Task).create({
    name: ctx.request.body.name,
    type: ctx.request.body.type,
    activateUrl: ctx.request.body.activateUrl,
    description: ctx.request.body.description,
    rewardAmount: ctx.request.body.rewardAmount,
    avatarUrl: ctx.request.body.avatarUrl,
    active: true,
  });

  let settings = await AppSettingsService.getAppSettings();
  settings.lastTaskAddedAt = Date.now();
  await appDataSource.getRepository(AppSettings).save(settings);

  await appDataSource.getRepository(Task).save(task);

  broadcastSend("taskAdded")

  ctx.body = task;
};

export const getTaskById = async (ctx: { params: { id: any }; body: any }) => {
  const task = await appDataSource.getRepository(Task).findOneOrFail(ctx.params.id);
  ctx.body = task;
};

export const updateTask = async (ctx: {
  params: { id: any };
  request: { body: { name: any; description: any; avatarUrl: any; type: any; activateUrl: any; rewardAmount: any } };
  body: any;
}) => {
  const task = await appDataSource.getRepository(Task).findOneOrFail(ctx.params.id);
  task.name = ctx.request.body.name;
  task.description = ctx.request.body.description;
  task.avatarUrl = ctx.request.body.avatarUrl;
  task.type = ctx.request.body.type;
  task.activateUrl = ctx.request.body.activateUrl;
  task.rewardAmount = ctx.request.body.rewardAmount;

  await appDataSource.getRepository(Task).save(task);

  ctx.body = task;
};

export const getBusinesses = async (ctx: { body: any }) => {
  const businesses = await appDataSource.getRepository(Business).find({
    where: {
      isDeleted: false,
    },
  });
  ctx.body = businesses;
};

export const getBusinessById = async (ctx: { params: { id: any }; body: any }) => {
  const business = await appDataSource.getRepository(Business).findOneOrFail(ctx.params.id);
  ctx.body = business;
};

export const addBusiness = async (ctx: {
  request: {
    body: {
      name: any;
      description: any;
      avatarUrl: any;
      rewardPerHour: any;
      refsToUnlock: any;
      price: any;
      category: any;
    };
  };
  body: any;
}) => {
  const business = await appDataSource.getRepository(Business).create({
    name: ctx.request.body.name,
    description: ctx.request.body.description,
    avatarUrl: ctx.request.body.avatarUrl,
    rewardPerHour: ctx.request.body.rewardPerHour,
    refsToUnlock: ctx.request.body.refsToUnlock ? ctx.request.body.refsToUnlock : 0,
    price: ctx.request.body.price,
    category: ctx.request.body.category,
    isDeleted: false,
  });

  await appDataSource.getRepository(Business).save(business);

  ctx.body = business;
};

export const deleteBusiness = async (ctx: { params: { id: any } }) => {
  const business = await appDataSource.getRepository(Business).findOneOrFail(ctx.params.id);
  business.isDeleted = true;
  await appDataSource.getRepository(Business).save(business);
};

export const updateBusiness = async (ctx: {
  params: { id: any };
  request: {
    body: {
      name: any;
      description: any;
      avatarUrl: any;
      rewardPerHour: any;
      refsToUnlock: any;
      price: any;
      category: any;
    };
  };
  body: any;
}) => {
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
};

export const resetUsers = async (ctx: Context) => {
  await appDataSource
    .getRepository(User)
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
};

export const broadcast = async (ctx: Context) => {
  const { message } = ctx.request.body as { message: string };

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
    logger.error("Error during broadcasting:", error);
    ctx.status = 500;
    ctx.body = "Internal Server Error";
  }
};
