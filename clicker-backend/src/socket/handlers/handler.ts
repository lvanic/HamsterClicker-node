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
  findUserByTgId,
  findUserByTgIdWithRelations,
  getUserByTgId,
  getUserPlaceInTop,
  updateUserByTgId,
} from "../../services/userService";

// TODO: replace with redis
const buffer: Record<string, { timestamp: number; multiplier: number; ignoreEnergy: boolean }[]> = {};
const activeBoosts: Map<string, { type: "X2" | "X2_FREE" | "HANDICAP"; expiresAt: number }> = new Map();
const BOOST_DURATION = 60 * 2000; // 1 minute
const AIRDROP_DATE = new Date("2025-07-01T00:00:00Z");

export const initSocketsLogic = (io: Socket) => ({
  clickEvent: async (data: string) => {
    try {
      const now = new Date();
      const difference = AIRDROP_DATE.getTime() - now.getTime();
      if (difference <= 0) {
        return;
      }

      const parsedData = JSON.parse(data);
      const tgUserId = parsedData["user_id"];

      if (!buffer[tgUserId]) {
        buffer[tgUserId] = [];
      }

      const userBoost = activeBoosts.get(tgUserId);
      let boostMult = 1;

      if (userBoost) {
        if (userBoost.expiresAt < Date.now()) {
          // boost expired
          if (userBoost.type === "X2") {
            await updateUserByTgId(tgUserId, { isX2Active: false });
          } else if (userBoost.type === "HANDICAP") {
            await updateUserByTgId(tgUserId, { isHandicapActive: false });
          }
          activeBoosts.delete(tgUserId);
          io.emit("deactivatedPaidBoost", userBoost.type);
          logger.debug("Boost expired", { tgUserId });
        } else {
          boostMult = userBoost.type === "X2" ? 2 : userBoost.type === "HANDICAP" ? 5 : 1;
        }
      }

      // Добавляем клик в buffer с мультипликатором и временем
      buffer[tgUserId].push({
        timestamp: Date.now(),
        multiplier: boostMult,
        ignoreEnergy: userBoost !== undefined,
      });

      logger.debug("Click processed", {
        tgUserId,
        boostMult,
        totalClicks: buffer[tgUserId].length,
      });
    } catch (error) {
      logger.error("Error while click processing", error);
    }
  },

  checkTaskStatus: async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const [tgUserId, taskId] = parsedData;

      if (taskId === "referral") {
        await updateUserByTgId(tgUserId, {
          newReferrals: 0,
          isReferralTaskActive: true,
        });
        return;
      }
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
          const now = new Date();
          const difference = AIRDROP_DATE.getTime() - now.getTime();
          if (difference <= 0) {
            return;
          }
          await updateUserByTgId(tgUserId, {
            balance: user.balance, //+ task.rewardAmount
            score: user.score, //+ task.rewardAmount
            completedTasks: [...user.completedTasks, task],
          });
          io.emit("reward", task.rewardAmount);
          io.emit("taskStatus", { id: task.id, finished: true });
        } else {
          io.emit("taskStatus", { id: task.id, finished: false });
        }
      } else {
        const now = new Date();
        const difference = AIRDROP_DATE.getTime() - now.getTime();
        if (difference <= 0) {
          return;
        }
        await updateUserByTgId(tgUserId, {
          balance: user.balance, //+ task.rewardAmount
          score: user.score, // + task.rewardAmount
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

      const bufferClicksList = buffer[userId] || [];

      const latestClickTimestamp = bufferClicksList.reduce((latest, click) => {
        return Math.max(latest, click.timestamp || 0);
      }, 0);

      const lastActivityTimestamp = Math.max(user.lastOnlineTimeStamp, latestClickTimestamp);

      const secondsOffline = (new Date().getTime() - lastActivityTimestamp) / 1000;
      const availableEnergy = user.energy;

      const clicks = buffer[userId] ?? [];
      const bufferClicks =
        clicks
          .filter((x) => x.ignoreEnergy === false)
          .slice(0, availableEnergy)
          .reduce((acc, click) => acc + click.multiplier, 0) +
        clicks.filter((x) => x.ignoreEnergy === true).reduce((acc, click) => acc + click.multiplier, 0);

      const clickCount = buffer[userId]?.filter((click) => !click.ignoreEnergy).length || 0;

      const energyToRestore = Math.min((secondsOffline - clickCount) / 2, USER_MAX_ENERGY - availableEnergy);

      const hoursOffline = Math.min(Math.floor(secondsOffline / 3600), 3);

      let offlineReward = 10 * calculateUsersOfflineReward(hoursOffline, user.level);
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

      const now = new Date();
      const difference = AIRDROP_DATE.getTime() - now.getTime();
      if (difference <= 0) {
        offlineReward = 0;
      }

      await updateUserByTgId(userId, {
        balance: user.balance, //+ offlineReward + bufferClicks * user.level
        score: user.score,
        scoreLastDay: user.scoreLastDay,
        addedFromBusinesses: 0,
        energy: Math.floor(user.energy + energyToRestore),
        lastOnlineTimeStamp: new Date().getTime(),
      });

      const userPlaceInTop = getUserPlaceInTop(user.score);

      io.emit("user", {
        id: user.tgId,
        ...user,
        balance: user.balance,
        score: user.score,
        referrals: user.referrals,
        clickPower: user.clickPower,
        userPlaceInLeague: userPlaceInTop,
        totalIncomePerHour: 100 * user.level,
        completedTasks: user.completedTasks,
        league: { id: 1 }, // TODO: completely remove leagues
        userLevel: user.level,
        energyLevel: 0, // TODO: completely remove energyLevel
        maxEnergy: USER_MAX_ENERGY,
        energy: Math.floor(user.energy + energyToRestore),
        offlineReward,
        isBoostX2Active: user.isX2Active,
        isHandicapActive: user.isHandicapActive,
        x2ExpiresAt: user.x2ExpiresAt,
        handicapExpiresAt: user.handicapExpiresAt,
        isReferralTaskActive: user.isReferralTaskActive,
        newReferrals: user.newReferrals,
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
      const availableEnergy = user.energy;

      const clicks = buffer[tgUserId] ?? [];
      const bufferClicks =
        clicks
          .filter((x) => x.ignoreEnergy === false)
          .slice(0, availableEnergy)
          .reduce((acc, click) => acc + click.multiplier, 0) +
        clicks.filter((x) => x.ignoreEnergy === true).reduce((acc, click) => acc + click.multiplier, 0);

      await updateUserByTgId(tgUserId, {
        lastOnlineTimeStamp: new Date().getTime(),
        energy: USER_MAX_ENERGY,
        fullEnergyActivates: ++user.fullEnergyActivates,
        score: user.score + bufferClicks * user.level,
        balance: user.balance, // + bufferClicks * user.level
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

      const bufferClicks =
        buffer[userId]?.reduce((acc, click) => {
          return acc + click.multiplier;
        }, 0) || 0;
      const score = user.score + bufferClicks * user.level;

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

    const now = Date.now();

    const isSameUtcDay = (timestamp: number) => {
      const date1 = new Date(timestamp);
      const date2 = new Date(now);
      return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
      );
    };

    try {
      logger.debug("Activating paid boost", {
        tgUserId,
        boostName,
      });

      const user = await getUserByTgId(tgUserId);

      const availableEnergy = user.energy;
      const clicks = buffer[tgUserId] ?? [];
      const bufferClicks =
        clicks
          .filter((x) => x.ignoreEnergy === false)
          .slice(0, availableEnergy)
          .reduce((acc, click) => acc + click.multiplier, 0) +
        clicks.filter((x) => x.ignoreEnergy === true).reduce((acc, click) => acc + click.multiplier, 0);

      if (boostName === "X2") {
        if (user.isX2Active) {
          logger.warn("Received a request for activation when the boost is already active", parsedData);
          io.emit("activatedPaidBoost", "X2");
          return;
        }

        if (user.X2UsedCount > 5) {
          logger.warn("Received a request for activation when the boost is already active", parsedData);
          io.emit("errorActivatedPaidBoost", "FALSE");
          return;
        }

        await updateUserByTgId(tgUserId, {
          isX2Active: true,
          x2ExpiresAt: Date.now() + BOOST_DURATION,
          X2UsedCount: user.X2UsedCount + 1,
          energy: USER_MAX_ENERGY,
          balance: user.balance, //+ bufferClicks * user.level
          score: user.score + bufferClicks * user.level,
        });

        activeBoosts.set(tgUserId, { type: "X2", expiresAt: Date.now() + BOOST_DURATION });
        io.emit("activatedPaidBoost", "X2");
      } else if (boostName === "HANDICAP") {
        if (user.isHandicapActive) {
          logger.warn("Received a request for activation when the boost is already active", parsedData);
          io.emit("activatedPaidBoost", "HANDICAP");
          return;
        }

        if (user.handicapUsedCount > 5) {
          logger.warn("Received a request for activation when the boost is already active", parsedData);
          io.emit("errorActivatedPaidBoost", "FALSE");
          return;
        }

        await updateUserByTgId(tgUserId, {
          isHandicapActive: true,
          handicapExpiresAt: Date.now() + BOOST_DURATION,
          handicapUsedCount: user.handicapUsedCount + 1,
          energy: USER_MAX_ENERGY,
          balance: user.balance, // + bufferClicks * user.level
          score: user.score + bufferClicks * user.level,
        });
        activeBoosts.set(tgUserId, { type: "HANDICAP", expiresAt: Date.now() + BOOST_DURATION });
        io.emit("activatedPaidBoost", "HANDICAP");
      } else if (boostName === "X2_FREE") {
        if (user.isHandicapActive) {
          logger.warn("Received a request for activation when the boost is already active", parsedData);
          io.emit("activatedPaidBoost", "X2_FREE");
          return;
        }

        if (user.lastX2FreeUsedAt && isSameUtcDay(user.lastX2FreeUsedAt)) {
          logger.warn("Received a request for activation when the boost is already active", parsedData);
          io.emit("errorActivatedPaidBoost", "FALSE");
          return;
        }

        await updateUserByTgId(tgUserId, {
          isX2Active: true,
          x2ExpiresAt: Date.now() + BOOST_DURATION,
          lastX2FreeUsedAt: Date.now(),
          energy: USER_MAX_ENERGY,
          balance: user.balance, //+ bufferClicks * user.level
          score: user.score + bufferClicks * user.level,
        });

        activeBoosts.set(tgUserId, { type: "X2", expiresAt: Date.now() + BOOST_DURATION });
        io.emit("activatedPaidBoost", "X2_FREE");
      } else {
        logger.warn("Received a request for an unprocessed boost", parsedData);
        return;
      }

      setTimeout(() => {
        const boost = activeBoosts.get(tgUserId);
        if (boost) {
          if (boost.type === "X2" || boost.type === "X2_FREE") {
            updateUserByTgId(tgUserId, { isX2Active: false });
          } else if (boost.type === "HANDICAP") {
            updateUserByTgId(tgUserId, { isHandicapActive: false });
          }
          activeBoosts.delete(tgUserId);
          io.emit("deactivatedPaidBoost", boost.type);
        }
      }, BOOST_DURATION);
    } catch (error) {
      logger.error("Error while attempt to activate paid boost", error);
    }
  },

  disconnect: async (): Promise<void> => {
    try {
      const tgUserId = Number((io as unknown as { userId: string }).userId);

      logger.debug("Disconnecting user", { tgUserId });

      const user = await getUserByTgId(tgUserId);

      if (user.isX2Active && user.x2ExpiresAt && user.x2ExpiresAt < Date.now()) {
        await updateUserByTgId(tgUserId, { isX2Active: false });
        activeBoosts.delete(tgUserId.toString());
        logger.debug("Boost expired", { tgUserId });
      }
      if (user.isHandicapActive && user.handicapExpiresAt && user.handicapExpiresAt < Date.now()) {
        await updateUserByTgId(tgUserId, { isHandicapActive: false });
        activeBoosts.delete(tgUserId.toString());
        logger.debug("Boost expired", { tgUserId });
      }

      const currentTime = Date.now();
      const timeDiff = (currentTime - user.lastOnlineTimeStamp) / 1000;
      const restoredEnergy = Math.floor(timeDiff / 2);

      const clicks = buffer[tgUserId] || [];
      if (clicks.length > 0) {
        const energyAvailable = user.energy + restoredEnergy;

        const clicks = buffer[tgUserId] ?? [];
        const bufferClicks =
          clicks
            .filter((x) => x.ignoreEnergy === false)
            .slice(0, energyAvailable)
            .reduce((acc, click) => acc + click.multiplier, 0) +
          clicks.filter((x) => x.ignoreEnergy === true).reduce((acc, click) => acc + click.multiplier, 0);

        const balanceIncrement = bufferClicks * user.level;
        const clickCount = clicks.filter((c) => !c.ignoreEnergy).length;

        const userEnergy = Math.max(0, Math.min(energyAvailable - clickCount, USER_MAX_ENERGY));

        logger.debug("User disconnected (buffer processed)", {
          tgId: tgUserId,
          totalClicks: clicks.length,
          appliedClicks: clickCount,
          userEnergy: user.energy,
          restoredEnergy,
          score: user.score,
        });

        await updateUserByTgId(tgUserId, {
          balance: user.balance, //+ balanceIncrement
          score: user.score, //+ balanceIncrement
          scoreLastDay: user.scoreLastDay, //+ balanceIncrement
          lastOnlineTimeStamp: currentTime,
          energy: userEnergy,
        });
        delete buffer[tgUserId];
        return;
      }

      const userEnergy = Math.max(0, Math.floor(Math.min(user.energy + restoredEnergy, USER_MAX_ENERGY)));

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
