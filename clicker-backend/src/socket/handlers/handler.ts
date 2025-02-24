import { Socket } from "socket.io";
import { appDataSource } from "../../core/database";
import logger from "../../core/logger";
import { getLang } from "../../getLang";
import { Task } from "../../models/task";
import { User } from "../../models/user";
import { getAppSettings } from "../../services/appSettingsService";
import { findTaskById } from "../../services/taskService";
import {
  calculateUsersOfflineReward,
  getUserPlaceInTop,
} from "../../services/userService";

// TODO: get rid from the buffer
export let buffer: Record<string, number> = {};

export const initSocketsLogic = (io: Socket) => ({
  clickEvent: async (data: string) => {
    try {
      logger.debug("Processing click", data);

      const parsedData = JSON.parse(data);
      const tgUserId = parsedData["user_id"]; // REVISIT: why is there a user_id in the request body

      if (!buffer[tgUserId]) {
        buffer[tgUserId] = 0;
      }

      buffer[tgUserId]++;
    } catch (error) {
      logger.error("Error while click processing", error);
    }
  },
  checkTaskStatus: async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const [tgUserId, taskId] = parsedData;

      const task = await findTaskById(taskId);
      if (!task) {
        logger.warn("Attempt to retrieve not-existing task", taskId);
        return;
      }

      const user = await appDataSource.getRepository(User).findOne({
        where: { tgId: tgUserId },
        relations: ["completedTasks"],
      });
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
          user.completedTasks.push(task);
          user.balance += task.rewardAmount;
          user.score += task.rewardAmount;

          await appDataSource.getRepository(User).save(user);
          io.emit("reward", task.rewardAmount);
          io.emit("taskStatus", { id: task.id, finished: true });
        } else {
          io.emit("taskStatus", { id: task.id, finished: false });
        }
      } else {
        user.completedTasks.push(task);

        user.balance += task.rewardAmount;
        user.score += task.rewardAmount;

        await appDataSource.getRepository(User).save(user);

        io.emit("reward", task.rewardAmount);

        io.emit("taskStatus", { id: task.id, finished: true });
      }
    } catch (error) {
      logger.error("Error while checking task status", error);
    }
  },

  getUser: async (userId: number) => {
    try {

      if (!user) {
        logger.warn("Attempt to retrieve a non-existent user", userId);
        return;
      }

    const secondsOffline = (new Date().getTime() - user.lastOnlineTimeStamp) / 1000;
    const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);
    const bufferClicks = buffer[userId] || 0;
    const availableEnergy = userMaxEnergy - user.energy;

    const energyToRestore = Math.min((secondsOffline - bufferClicks) / 2, availableEnergy);

    const hoursOffline = Math.min(Math.floor(secondsOffline / 3600), 3);

      const offlineReward = calculateUsersOfflineReward(hoursOffline, user.level);
      logger.debug("User was rewarded for time offline", {
        userId,
        offlineReward,
      });
        scoreLastDay: user.scoreLastDay + offlineReward + bufferClicks * user.level,
        energy: user.energy + energyToRestore,
        lastOnlineTimeStamp: new Date().getTime(),
      },
    );

      const userPlaceInTop = getUserPlaceInTop(user.score);
        balance: user.balance + bufferClicks * user.level + offlineReward,
        score: user.score + bufferClicks * user.level + offlineReward,

    } catch (error) {
      logger.error("Error while getting user info", error);
    }
  },
  getLeagueInfo: async () => {
    try {
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
      const appSettings = await getAppSettings();

      if (boostName !== "fullEnergyBoost") {
        logger.warn("Received a request for an unprocessed boost", parsedData);
        return;
      }
        return;
      }

      if (user.fullEnergyActivates < appSettings.fullEnergyBoostPerDay) {
        const message = getLang(lang, "energyRestored");

        await appDataSource.getRepository(User).update(
          {
            tgId: user.tgId,
          },
          {
            lastOnlineTimeStamp: new Date().getTime(),
            energy: 1000 + 500 * (user.energyLevel - 1),
            fullEnergyActivates: ++user.fullEnergyActivates,
            score: user.score + (buffer[tgUserId] || 0) * user.level,
            balance: user.balance + (buffer[tgUserId] || 0) * user.level,
          },
        );

        delete buffer[tgUserId];

    } catch (error) {
      logger.error("Error while attempt to activate energy boost", error);
      io.emit("boostActivated", { success: false, message: getLang(lang, "transactionFailed") });
    }
  },

  userLeague: async (userId: number) => {
    try {
      if (!user) {
        logger.warn("Attempt to retrieve a non-existent user", userId);
        return;
      }

      const score = user.score + (buffer[tgUserId] || 0) * user.level;

      const userPlaceInTop = getUserPlaceInTop(score);

      io.emit("userLeague", { userLeague: {}, userPlaceInLeague: userPlaceInTop, userLevel: {} });
    } catch (error) {
      logger.error("Error while getting a user league", error);
    }
  },

  disconnect: async () => {
    const tgUserId = Number((io as unknown as { userId: string }).userId);
    const user = await appDataSource.getRepository(User).findOneOrFail({ where: { tgId: tgUserId } });

    if (buffer[tgUserId] > 0) {
      if (user) {
        const currentTime = new Date().getTime();
        const timeDiff = (currentTime - user.lastOnlineTimeStamp) / 1000;
        const restoredEnergy = timeDiff / 2;
        const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);

        const balanceIncrement = buffer[tgUserId] * user.level;

        try {
          await appDataSource.getRepository(User).update(
            { tgId: tgUserId },
            {
              balance: user.balance + balanceIncrement,
              score: user.score + balanceIncrement,
              scoreLastDay: user.scoreLastDay + balanceIncrement,
              lastOnlineTimeStamp: currentTime,
              energy: Math.min(user.energy - buffer[tgUserId] + restoredEnergy, userMaxEnergy),
            },
          );
          delete buffer[tgUserId];
        } catch (error) {
          console.error("Ошибка обновления пользователя при отключении:", error);
        }
      }
    } else {
      let clickCount = 0;

      const currentTime = new Date().getTime();
      const timeDiff = (currentTime - user.lastOnlineTimeStamp) / 1000;
      const restoredEnergy = Math.floor(timeDiff / 2);
    } catch (error) {
      logger.error("Error during disconnection", error);
    }
  },
});
