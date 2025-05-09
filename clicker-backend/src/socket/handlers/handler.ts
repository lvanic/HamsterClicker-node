import { Socket } from "socket.io";
import { config } from "../../core/config";
import { USER_MAX_ENERGY } from "../../core/constants";
import { appDataSource } from "../../core/database";
import logger from "../../core/logger";
import { getLang } from "../../getLang";
import { Task } from "../../models/task";
import { User } from "../../models/user";
import { getAppSettings } from "../../services/appSettingsService";
import { findTaskById } from "../../services/taskService";
import {
  calculateUsersOfflineReward,
  findUserByTgIdWithRelations,
  getUserByTgId,
  getUserPlaceInTop,
  updateUserByTgId,
} from "../../services/userService";

// TODO: replace with redis
const buffer: Record<string, number> = {};
const activeBoosts: Map<string, { type: "X2" | "HANDICAP"; expiresAt: number }> = new Map();

export const initSocketsLogic = (io: Socket) => ({
  clickEvent: async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const tgUserId = parsedData["user_id"]; // REVISIT: why is there a user_id in the request body

      if (!buffer[tgUserId]) {
        buffer[tgUserId] = 0;
      }

      const expiresAt = activeBoosts.get(tgUserId)?.expiresAt;
      const boostType = activeBoosts.get(tgUserId)?.type;
      let boostMult = boostType == "X2" ? 2 : boostType == "HANDICAP" ? 5 : 1;

      if (expiresAt && expiresAt < Date.now()) {
        if (boostType === "X2") {
          await updateUserByTgId(tgUserId, { isX2Active: false });
        } else if (boostType === "HANDICAP") {
          await updateUserByTgId(tgUserId, { isHandicapActive: false });
        }
        boostMult = 1;
        activeBoosts.delete(tgUserId);
        logger.debug("Boost expired", { tgUserId });
      }

      buffer[tgUserId] = buffer[tgUserId] + 1 * boostMult;

      logger.debug("Click processed", {
        tgUserId,
        currentBuffer: buffer[tgUserId],
      });
    } catch (error) {
      logger.error("Error while click processing", error);
    }
  },

  checkTaskStatus: async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const [tgUserId, taskId] = parsedData;

      logger.debug("Checking task status", {
        tgUserId,
        taskId,
      });

      const task = await findTaskById(taskId);
      if (!task) {
        logger.warn("Attempt to retrieve not-existing task", taskId);
        return;
      }

      const user = await findUserByTgIdWithRelations(tgUserId, ["completedTasks"]);
      if (!user) {
        logger.warn("Attempt to retrieve not-existing user", tgUserId);
        return;
      }

      if (user.completedTasks.some((ut) => ut.id === task.id)) {
        logger.warn("Attempt to complete a task twice", tgUserId);
        return;
      }

      if (task.type === "telegram") {
        const slices = task.activateUrl.split("/");
        const tgChatId = slices[slices.length - 1];

        const res = await fetch(
          `https://api.telegram.org/bot${config.TG_BOT_TOKEN}/getChatMember?chat_id=@${tgChatId}&user_id=${tgUserId}`,
        );
        const data = (await res.json()) as {
          ok: boolean;
          result: { status: string };
        };

        if (data.ok && data.result && data.result.status !== "left" && data.result.status !== "kicked") {
          await updateUserByTgId(tgUserId, {
            balance: user.balance + task.rewardAmount,
            score: user.score + task.rewardAmount,
            completedTasks: [...user.completedTasks, task],
          });
          io.emit("reward", task.rewardAmount);
          io.emit("taskStatus", { id: task.id, finished: true });
        } else {
          io.emit("taskStatus", { id: task.id, finished: false });
        }
      } else {
        await updateUserByTgId(tgUserId, {
          balance: user.balance + task.rewardAmount,
          score: user.score + task.rewardAmount,
          completedTasks: [...user.completedTasks, task],
        });

        io.emit("reward", task.rewardAmount);
        io.emit("taskStatus", { id: task.id, finished: true });
      }
    } catch (error) {
      logger.error("Error while checking task status", error);
    }
  },

  getUser: async (userId: number) => {
    try {
      logger.debug("Getting user", { userId });
      const user = await findUserByTgIdWithRelations(userId, ["referrals", "completedTasks"]);

      if (!user) {
        logger.warn("Attempt to retrieve a non-existent user", userId);
        return;
      }

      const secondsOffline = (new Date().getTime() - user.lastOnlineTimeStamp) / 1000;
      const bufferClicks = buffer[userId] || 0;
      const availableEnergy = USER_MAX_ENERGY - user.energy;

      const energyToRestore = Math.min((secondsOffline - bufferClicks) / 2, availableEnergy);

      const hoursOffline = Math.min(Math.floor(secondsOffline / 3600), 3);

      const offlineReward = calculateUsersOfflineReward(hoursOffline, user.level);
      logger.debug("Updating user data", {
        userId,
        offlineReward,
        energyDB: user.energy,
        restoredEnergy: energyToRestore,
        scoreLastDay: user.scoreLastDay,
        score: user.score,
        bufferClicks,
        secondsOffline,
      });

      await updateUserByTgId(userId, {
        balance: user.balance + offlineReward + bufferClicks * user.level,
        score: user.score + offlineReward + bufferClicks * user.level,
        scoreLastDay: user.scoreLastDay + offlineReward + bufferClicks * user.level,
        addedFromBusinesses: offlineReward,
        energy: user.energy + energyToRestore,
        lastOnlineTimeStamp: new Date().getTime(),
      });

      const userPlaceInTop = getUserPlaceInTop(user.score);

      io.emit("user", {
        id: user.tgId,
        ...user,
        balance: user.balance + bufferClicks * user.level + offlineReward,
        score: user.score + bufferClicks * user.level + offlineReward,
        referrals: user.referrals,
        clickPower: user.clickPower,
        userPlaceInLeague: userPlaceInTop,
        totalIncomePerHour: 100 * user.level,
        completedTasks: user.completedTasks,
        league: { id: 1 }, // TODO: completely remove leagues
        userLevel: user.level,
        energyLevel: 0, // TODO: completely remove energyLevel
        maxEnergy: USER_MAX_ENERGY,
        energy: Math.floor(user.energy + energyToRestore - bufferClicks),
        offlineReward,
        isBoostX2Active: user.isX2Active,
        isHandicapActive: user.isHandicapActive,
      });

      delete buffer[userId];
    } catch (error) {
      logger.error("Error while getting user info", error);
    }
  },

  getLeagueInfo: async () => {
    try {
      logger.debug("Getting top users");

      const userRepository = await appDataSource.getRepository(User);

      const topUsers = await userRepository.find({
        order: { score: "DESC" },
        take: 100,
      });

      io.emit("league", { league: { id: 1 }, usersInLeague: {}, topUsersInLeague: topUsers });
    } catch (error) {
      logger.error("Error while getting league info", error);
    }
  },

  getTasks: async () => {
    try {
      logger.debug("Getting tasks");

      const tasks = await appDataSource.getRepository(Task).find({ where: { active: true } });
      io.emit("tasks", tasks);
    } catch (error) {
      logger.error("Error while getting tasks", error);
    }
  },

  activateBoost: async (data: string) => {
    const parsedData = JSON.parse(data);
    const [tgUserId, boostName, lang] = parsedData;

    try {
      logger.debug("Activating boost", {
        tgUserId,
        boostName,
      });

      const appSettings = await getAppSettings();
      const user = await getUserByTgId(tgUserId);

      if (boostName !== "fullEnergyBoost") {
        logger.warn("Received a request for an unprocessed boost", parsedData);
        return;
      }

      if (user.fullEnergyActivates >= appSettings.fullEnergyBoostPerDay) {
        logger.warn("Received a request for activation when there are no boosters left", parsedData);

        const message = getLang(lang, "fullEnergyLimit");

        io.emit("boostActivated", {
          success: false,
          message: message,
        });
        return;
      }

      const message = getLang(lang, "energyRestored");
      await updateUserByTgId(tgUserId, {
        lastOnlineTimeStamp: new Date().getTime(),
        energy: USER_MAX_ENERGY,
        fullEnergyActivates: ++user.fullEnergyActivates,
        score: user.score + (buffer[tgUserId] || 0) * user.level,
        balance: user.balance + (buffer[tgUserId] || 0) * user.level,
      });

      logger.debug("Resetting the user buffer after activating the boost", {
        tgUserId,
        currentBuffer: buffer[tgUserId],
        score: user.score,
      });

      delete buffer[tgUserId];

      io.emit("boostActivated", {
        success: true,
        message: message,
      });
      io.emit("energyRestored", { energy: user.energy });
    } catch (error) {
      logger.error("Error while attempt to activate energy boost", error);
      io.emit("boostActivated", { success: false, message: getLang(lang, "transactionFailed") });
    }
  },

  userLeague: async (userId: number): Promise<void> => {
    try {
      logger.debug("Getting user place in league", {
        userId,
      });

      const user = await findUserByTgIdWithRelations(userId, ["referrals", "completedTasks"]);

      if (!user) {
        logger.warn("Attempt to retrieve a non-existent user", userId);
        return;
      }

      const score = user.score + (buffer[userId] || 0) * user.level;

      const userPlaceInTop = getUserPlaceInTop(score);

      io.emit("userLeague", { userLeague: {}, userPlaceInLeague: userPlaceInTop, userLevel: {} });
    } catch (error) {
      logger.error("Error while getting a user league", error);
    }
  },

  activatePaidBoost: async (data: string) => {
    const parsedData = JSON.parse(data);
    const [tgUserId, boostName] = parsedData;

    // add check payment

    try {
      logger.debug("Activating paid boost", {
        tgUserId,
        boostName,
      });

      const user = await getUserByTgId(tgUserId);

      if (boostName === "X2") {
        if (user.isX2Active) {
          logger.warn("Received a request for activation when the boost is already active", parsedData);
          io.emit("activatedPaidBoost", "X2");
          return;
        }

        await updateUserByTgId(tgUserId, {
          isX2Active: true,
          x2ExpiresAt: Date.now() + 60 * 1000,
        });
        activeBoosts.set(tgUserId, { type: "X2", expiresAt: Date.now() + 60 * 1000 });
        io.emit("activatedPaidBoost", "X2");
      } else if (boostName === "HANDICAP") {
        if (user.isHandicapActive) {
          logger.warn("Received a request for activation when the boost is already active", parsedData);
          io.emit("activatedPaidBoost", "HANDICAP");
          return;
        }

        await updateUserByTgId(tgUserId, {
          isHandicapActive: true,
          handicapExpiresAt: Date.now() + 60 * 1000,
        });
        activeBoosts.set(tgUserId, { type: "HANDICAP", expiresAt: Date.now() + 60 * 1000 });
        io.emit("activatedPaidBoost", "HANDICAP");
      } else {
        logger.warn("Received a request for an unprocessed boost", parsedData);
        return;
      }

      setTimeout(() => {
        const boost = activeBoosts.get(tgUserId);
        if (boost) {
          if (boost.type === "X2") {
            updateUserByTgId(tgUserId, { isX2Active: false });
          } else if (boost.type === "HANDICAP") {
            updateUserByTgId(tgUserId, { isHandicapActive: false });
          }
          activeBoosts.delete(tgUserId);
          io.emit("deactivatedPaidBoost", boost.type);
        }
      }, 60 * 1000);
    } catch (error) {
      logger.error("Error while attempt to activate paid boost", error);
    }
  },

  disconnect: async (): Promise<void> => {
    try {
      // TODO: get rid of this type casting
      const tgUserId = Number((io as unknown as { userId: string }).userId);

      logger.debug("Disconnecting user", { tgUserId });

      const user = await getUserByTgId(tgUserId);

      if(user.x2ExpiresAt && user.x2ExpiresAt < Date.now()) {
        await updateUserByTgId(tgUserId, { isX2Active: false });
        activeBoosts.delete(tgUserId.toString());
        logger.debug("Boost expired", { tgUserId });
      }
      if(user.handicapExpiresAt && user.handicapExpiresAt < Date.now()) {
        await updateUserByTgId(tgUserId, { isHandicapActive: false });
        activeBoosts.delete(tgUserId.toString());
        logger.debug("Boost expired", { tgUserId });
      }

      const currentTime = new Date().getTime();
      const timeDiff = (currentTime - user.lastOnlineTimeStamp) / 1000;
      const restoredEnergy = Math.floor(timeDiff / 2);

      if (buffer[tgUserId] > 0) {
        const balanceIncrement = buffer[tgUserId] * user.level;
        const userEnergy = Math.min(user.energy - buffer[tgUserId] + restoredEnergy, USER_MAX_ENERGY);

        logger.debug("User disconnected (non-empty buffer)", {
          tgId: tgUserId,
          userBuffer: buffer[tgUserId],
          userEnergy: user.energy,
          restoredEnergy: restoredEnergy,
          score: user.score,
          scoreLastDay: user.scoreLastDay,
        });

        await updateUserByTgId(tgUserId, {
          balance: user.balance + balanceIncrement,
          score: user.score + balanceIncrement,
          scoreLastDay: user.scoreLastDay + balanceIncrement,
          lastOnlineTimeStamp: currentTime,
          energy: userEnergy,
        });
        delete buffer[tgUserId];
        return;
      }

      const userEnergy = Math.min(user.energy + restoredEnergy, USER_MAX_ENERGY);

      logger.debug("User disconnected", {
        tgId: tgUserId,
        userBuffer: buffer[tgUserId],
        userEnergy: user.energy,
        restoredEnergy,
        score: user.score,
      });

      await updateUserByTgId(tgUserId, { lastOnlineTimeStamp: currentTime, energy: userEnergy });
    } catch (error) {
      logger.error("Error during disconnection", error);
    }
  },
});
