import { Socket } from "socket.io";
import { appDataSource } from "../../core/database";
import { getLang } from "../../getLang";
import { Task } from "../../models/task";
import { User } from "../../models/user";
import { getAppSettingsWithBusinesses } from "../../services/appSettingsService";
import { config } from "../../core/config";

// a reward is calculated for each whole hour passed. 
const calculateOfflineReward = (hours: number, level: number): number => {
  if (hours === 0) return 0;

  return ((100 * level) / Math.pow(2, hours - 1)) + calculateOfflineReward(hours - 1, level);
};

// TODO: get rid from the buffer
export let buffer: Record<string, number> = {};

export const initSocketsLogic = (io: Socket) => ({
  clickEvent: async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const tgUserId = parsedData["user_id"];

      if (!buffer[tgUserId]) {
        buffer[tgUserId] = 0;
      }

      buffer[tgUserId]++;
    } catch (e) {
      console.error(e);
    }
  },
  checkTaskStatus: async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const [tgUserId, taskId] = parsedData;

      const task = await appDataSource.getRepository(Task).findOneBy({
        id: taskId,
      });
      if (!task) {
        return;
      }

      const user = await appDataSource.getRepository(User).findOne({
        where: { tgId: tgUserId },
        relations: ["completedTasks"],
      });
      if (!user) {
        return;
      }

      if (user.completedTasks.some((ut) => ut.id === task.id)) {
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
      console.error("Error checking task status after multiple attempts:", error);
    }
  },

  // TODO: add error handler
  getUser: async (userId: number) => {
    const user = await appDataSource.getRepository(User).findOne({
      where: { tgId: userId },
      relations: ["referrals", "completedTasks"],
    });

    if (!user) {
      return;
    }

    const secondsOffline = (new Date().getTime() - user.lastOnlineTimeStamp) / 1000;
    const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);
    const bufferClicks = buffer[userId] || 0;
    const availableEnergy = userMaxEnergy - user.energy;

    const energyToRestore = Math.min((secondsOffline - bufferClicks) / 2, availableEnergy);

    const hoursOffline = Math.min(Math.floor(secondsOffline / 3600), 3);

    const totalReward = calculateOfflineReward(hoursOffline, user.level);

    console.log("Minutes offline: ", hoursOffline);

    await appDataSource.getRepository(User).update(
      { tgId: userId },
      {
        balance: user.balance + totalReward + bufferClicks * user.level,
        score: user.score + totalReward + bufferClicks * user.level,
        scoreLastDay: user.scoreLastDay + totalReward + bufferClicks * user.level,
        addedFromBusinesses: totalReward,
        energy: user.energy + energyToRestore,
        lastOnlineTimeStamp: new Date().getTime(),
      },
    );

    const userPlaceInTop =
      (
        (await appDataSource
          .getRepository(User)
          .createQueryBuilder("users")
          .select("COUNT(*) + 1", "rank")
          .where(`users.score > ${user.score}`)
          .getOne()) as unknown as { rank: number }
      )?.rank || 1;

    io.emit("user", {
      id: user.tgId,
      ...user,
      balance: user.balance + (buffer[userId] || 0) * user.level + totalReward,
      score: user.score + (buffer[userId] || 0) * user.level + totalReward,
      referrals: user.referrals,
      clickPower: user.clickPower,
      userPlaceInLeague: userPlaceInTop,
      totalIncomePerHour: 100 * user.level,
      completedTasks: user.completedTasks,
      league: { id: 1 },
      userLevel: user.level,
      energyLevel: user.energyLevel - (buffer[userId] || 0),
      maxEnergy: 1000 + 500 * (user.energyLevel - 1),
      energy: Math.floor(user.energy + energyToRestore - (buffer[userId] || 0)),
    });

    delete buffer[userId];
  },
  getLeagueInfo: async () => {
    try {
      const userRepository = await appDataSource.getRepository(User);

      const topUsers = await userRepository.find({
        order: { score: "DESC" },
        take: 100,
      });

      io.emit("league", { league: { id: 1 }, usersInLeague: {}, topUsersInLeague: topUsers });
    } catch {
      console.log("error get league");
    }
  },

  getTasks: async () => {
    const tasks = await appDataSource.getRepository(Task).find({ where: { active: true } });
    io.emit("tasks", tasks);
  },
  activateBoost: async (data: string) => {
    const parsedData = JSON.parse(data);
    const [tgUserId, boostName, lang] = parsedData;

    try {
      const appSettings = await getAppSettingsWithBusinesses();
      const user = await appDataSource.getRepository(User).findOneBy({ tgId: tgUserId });
      if (!user) throw new Error("User not found");

      if (boostName !== "fullEnergyBoost") {
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

        io.emit("boostActivated", {
          success: true,
          message: message,
        });
        io.emit("energyRestored", { energy: user.energy });
      } else {
        const message = getLang(lang, "fullEnergyLimit");

        io.emit("boostActivated", {
          success: false,
          message: message,
        });
      }

      return; // Успешное завершение, выходим из функции
    } catch {
      console.error("Max retry attempts reached. Transaction failed.");
      io.emit("boostActivated", { success: false, message: getLang(lang, "transactionFailed") });
    }
  },

  userLeague: async (userId: number) => {
    try {
      const tgUserId = Number(userId);
      const user = await appDataSource.getRepository(User).findOne({
        where: { tgId: tgUserId },
        relations: ["referrals", "businesses", "completedTasks"],
      });

      if (!user) return;

      const score = user.score + (buffer[tgUserId] || 0) * user.level;

      const userPlaceInTop =
        (
          (await appDataSource
            .getRepository(User)
            .createQueryBuilder("users")
            .select("COUNT(*) + 1", "rank")
            .where(`users.score > ${score}`)
            .getOne()) as unknown as { rank: number }
        )?.rank || 1;

      io.emit("userLeague", { userLeague: {}, userPlaceInLeague: userPlaceInTop, userLevel: {} });
    } catch (e) {
      console.error(e);
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
      const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);

      clickCount = Math.min(user.energy + restoredEnergy, userMaxEnergy);

      if (0 > clickCount) {
        clickCount = 0;
      }

      try {
        await appDataSource
          .getRepository(User)
          .update({ tgId: tgUserId }, { lastOnlineTimeStamp: currentTime, energy: clickCount });
      } catch (error) {
        console.error("Ошибка обновления времени последнего подключения:", error);
      }
    }
  },
});
