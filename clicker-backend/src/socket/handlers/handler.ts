import { Socket } from "socket.io";
import { Between, MoreThan, In } from "typeorm";
import { appDataSource } from "../../core/database";
import { getLang } from "../../getLang";
import { Business } from "../../models/business";
import { Task } from "../../models/task";
import { User } from "../../models/user";
import { getAppSettingsWithBusinesses } from "../../services/appSettingsService";
import { config } from "../../core/config";

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
      relations: ["referrals", "businesses", "completedTasks", "businessUpgrades"],
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

    console.log("Hours offline: ", hoursOffline);

    await appDataSource.getRepository(User).update(
      { tgId: userId },
      {
        balance: user.balance + totalReward + bufferClicks * (user.clickPower + user.level - 1),
        score: user.score + totalReward + bufferClicks * (user.clickPower + user.level - 1),
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
      balance: user.balance + ((buffer[userId] || 0) * (user.clickPower + user.level - 1)) + totalReward,
      score: user.score + ((buffer[userId] || 0) * (user.clickPower + user.level - 1)) + totalReward,
      referrals: user.referrals,
      clickPower: user.clickPower,
      userPlaceInLeague: userPlaceInTop,
      totalIncomePerHour: 100 * user.level,
      completedTasks: user.completedTasks,
      league: { id: 1 },
      userLevel: user.level,
      energyLevel: user.energyLevel - (buffer[userId] || 0),
      maxEnergy: 1000 + 500 * (user.energyLevel - 1),
      energy: user.energy - (buffer[userId] || 0),
    });
  },
  getLeagueInfo: async () => {
    try {
      const userRepository = await appDataSource.getRepository(User);

      const topUsers = await userRepository.find({
        order: { score: "DESC" },
        take: 100
      });

      io.emit("league", { league: { id: 1 }, usersInLeague: {}, topUsersInLeague: topUsers });
    } catch {
      console.log("error get league");
    }
  },
  getBusinessesToBuy: async (userTgId: number) => {
    try {
      const user = await appDataSource
        .getRepository(User)
        .findOneOrFail({ where: { tgId: userTgId }, relations: ["businesses", "businessUpgrades"] });
      const businesses = await appDataSource.getRepository(Business).find({ where: { isDeleted: false } });

      const finalBusinesses = businesses.map((business) => {
        const businessUpgrade = user.businessUpgrades.find((bu) => bu.business.id === business.id);
        const businessLevel = businessUpgrade
          ? businessUpgrade.level
          : user.businesses.some((bu) => bu.id === business.id)
            ? 1
            : 0;

        return {
          ...business,
          rewardPerHour: business.rewardPerHour * 1.2 ** (businessLevel + 1),
          addedRewardPerHour:
            business.rewardPerHour * 1.2 ** (businessLevel + 1) - business.rewardPerHour * 1.2 ** businessLevel,
          price: business.price * 1.2 ** businessLevel,
          level: businessLevel,
          lastUpgradeTimestamp: businessUpgrade ? businessUpgrade.timestamp : null,
        };
      });

      io.emit("businesses", finalBusinesses);
    } catch (error) {
      console.error("Error fetching businesses to buy:", error);
    }
  },
  buyBusiness: async (data: string) => {
    const parsedData = JSON.parse(data);
    const [userTgId, businessId] = parsedData;

    try {
      const user = await appDataSource.getRepository(User).findOneOrFail({
        where: { tgId: userTgId },
        relations: ["businesses", "businessUpgrades", "currentComboCompletions"],
      });
      const business = await appDataSource.getRepository(Business).findOneOrFail({ where: { id: businessId } });

      if (
        !user ||
        business.refsToUnlock > user.businesses.length ||
        business.price > user.balance + (buffer[userTgId] || 0)
      ) {
        console.log("Недостаточно средств или бизнес заблокирован");
        io.emit("businessBought", { success: false, id: businessId });
        return;
      }

      const appSettings = await getAppSettingsWithBusinesses();

      const comboMatch =
        appSettings.comboBusinesses.some((c) => c.id == businessId) &&
        user.currentComboCompletions.length < 3 &&
        !user.currentComboCompletions.includes(businessId);
      const comboCompleted = comboMatch && user.currentComboCompletions.length == 2;

      user.balance -= business.price;
      user.businesses.push(business);

      if (comboMatch) {
        user.currentComboCompletions.push(businessId);
      }

      if (comboCompleted) {
        user.balance += appSettings.comboReward;
        io.emit("comboCompleted", { reward: appSettings.comboReward });
      }

      await appDataSource.getRepository(User).save(user);

      const updatedUser = await appDataSource.getRepository(User).findOneOrFail({
        where: { tgId: userTgId },
        relations: ["businesses", "businessUpgrades", "referrals", "completedTasks"],
      });

      const businesses = await appDataSource.getRepository(Business).find({
        where: { id: In(updatedUser.businesses.map((b) => b.id)) },
      });

      const totalIncomePerHour = businesses.reduce((sum, b) => {
        const businessUpgrade = updatedUser.businessUpgrades.find((bu) => bu.business.id === b.id);
        const businessLevel = businessUpgrade ? businessUpgrade.level : 1;
        return sum + b.rewardPerHour * 1.2 ** businessLevel;
      }, 0);

      io.emit("liteSync", {
        balance: updatedUser.balance,
        score: updatedUser.score,
        energy: updatedUser.energy,
        newBusinesses: businesses,
        totalIncomePerHour,
        currentComboCompletions: comboMatch ? updatedUser.currentComboCompletions : null,
      });

      io.emit("businessBought", { success: true, id: businessId });
    } catch (error) {
      console.error("Ошибка при покупке бизнеса после нескольких попыток:", error);
      io.emit("businessBought", { success: false, id: businessId });
    }
  },

  getTasks: async () => {
    const tasks = await appDataSource.getRepository(Task).find({ where: { active: true } });
    io.emit("tasks", tasks);
  },
  activateBoost: async (data: string) => {
    const parsedData = JSON.parse(data);
    const [tgUserId, boostName, lang] = parsedData;

    console.log(parsedData);

    try {
      const dayMs = 1000 * 60 * 60 * 24;
      const appSettings = await getAppSettingsWithBusinesses();
      const user = await appDataSource.getRepository(User).findOne({ where: { tgId: tgUserId } });
      if (!user) throw new Error("User not found");

      if (boostName === "fullEnergyBoost") {
        if (!user.lastFullEnergyTimestamp || user.lastFullEnergyTimestamp + dayMs < Date.now()) {
          user.fullEnergyActivates = 0;
          user.lastFullEnergyTimestamp = Date.now();
        }

        if (user.fullEnergyActivates < appSettings.fullEnergyBoostPerDay) {
          user.fullEnergyActivates++;
          user.energy = 1000 + 500 * (user.energyLevel - 1);
          const message = getLang(lang, "energyRestored");

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
      } else if (boostName === "dailyReward") {
        if (!user.lastDailyRewardTimestamp || user.lastDailyRewardTimestamp + dayMs < Date.now()) {
          user.lastDailyRewardTimestamp = Date.now();
          user.balance += appSettings.dailyReward;
          user.score += appSettings.dailyReward;

          io.emit("reward", appSettings.dailyReward);
          io.emit("boostActivated", {
            success: true,
            message: `${getLang(lang, "youReceived")} ${appSettings.dailyReward} ${getLang("en", "coins")}`,
          });
        } else {
          io.emit("boostActivated", {
            success: false,
            message: getLang(lang, "dailyRewardAlready"),
          });
        }
      }

      await appDataSource.getRepository(User).save(user);
      return; // Успешное завершение, выходим из функции
    } catch {
      console.error("Max retry attempts reached. Transaction failed.");
      io.emit("boostActivated", { success: false, message: getLang(lang, "transactionFailed") });
    }
  },

  upgradeClick: async (userId: number) => {
    try {
      const user = await appDataSource.getRepository(User).findOne({ where: { tgId: userId } });
      if (!user) throw new Error("User not found");

      const appSettings = await getAppSettingsWithBusinesses();
      if (!appSettings) {
        throw new Error("App settings not found");
      }

      if (user.clickPower >= appSettings.maxClickLevel) {
        throw new Error("Max click power level reached");
      }

      const cost = appSettings.startClickUpgradeCost * 2 ** (user.clickPower - 1);
      if (user.balance < cost) {
        throw new Error("Insufficient balance");
      }

      user.balance -= cost;
      user.clickPower++;

      await appDataSource.getRepository(User).manager.save(user);

      io.emit("clickPowerUpgraded", { success: true });
      io.emit("liteSync", { balance: user.balance, score: user.score, clickPower: user.clickPower });
      return;
    } catch (error) {
      console.log("Max retry attempts reached. Transaction failed.");
      io.emit("clickPowerUpgraded", { success: false });
    }
  },

  upgradeBusiness: async (data: string) => {
    const parsedData = JSON.parse(data);
    const [userTgId, businessId] = parsedData;

    try {
      const user = await appDataSource.getRepository(User).findOneOrFail({
        where: { tgId: userTgId },
        relations: ["businesses", "businessUpgrades", "currentComboCompletions"],
      });
      const business = await appDataSource.getRepository(Business).findOneOrFail({ where: { id: businessId } });

      if (!user.businesses.some((b) => b.id === business.id)) {
        io.emit("businessBought", { success: false, id: businessId });
        return;
      }

      const businessUpgrade = user.businessUpgrades.find((bu) => bu.business.id === business.id)!;
      if (businessUpgrade && businessUpgrade.level >= 10) {
        io.emit("businessBought", { success: false, id: businessId });
        return;
      }

      const newLevel = businessUpgrade ? businessUpgrade.level + 1 : 2;
      const finalPrice = Math.round(business.price * 1.2 ** (newLevel - 1));

      if (user.balance < finalPrice) {
        io.emit("businessBought", { success: false, id: businessId });
        return;
      }

      user.balance -= finalPrice;

      if (!businessUpgrade) {
        user.businessUpgrades.push({
          business,
          level: newLevel,
          timestamp: newLevel >= 3 ? Date.now() : 0,
          user,
          id: 1,
        });
      } else {
        businessUpgrade.level = newLevel;
        businessUpgrade.timestamp = newLevel >= 3 ? Date.now() : 0;
      }

      await appDataSource.getRepository(User).manager.save(user);

      io.emit("businessBought", { success: true, id: businessId });
    } catch (error) {
      console.error("Error upgrading business after multiple attempts:", error);
      io.emit("businessBought", { success: false, id: businessId });
    }
  },

  upgradeEnergy: async (userId: number) => {
    try {
      const user = await appDataSource.getRepository(User).findOne({ where: { tgId: userId } });
      if (!user) {
        io.emit("energyUpgraded", { success: false });
        return;
      }

      const appSettings = await getAppSettingsWithBusinesses();
      if (!appSettings) {
        io.emit("energyUpgraded", { success: false });
        return;
      }

      if (user.energyLevel >= appSettings.maxEnergyLevel) {
        io.emit("energyUpgraded", { success: false });
        return;
      }

      const cost = appSettings.startEnergyUpgradeCost * 2 ** (user.energyLevel - 1);
      if (user.balance + (buffer[userId] || 0) < cost) {
        io.emit("energyUpgraded", { success: false });
        return;
      }

      // Обновляем баланс и уровень энергии пользователя в одной операции
      user.balance -= cost;
      user.energyLevel += 1;

      await appDataSource.getRepository(User).save(user);

      io.emit("energyUpgraded", { success: true });
      io.emit("liteSync", {
        balance: user.balance,
        energyLevel: user.energyLevel,
        score: user.score,
      });
    } catch (error) {
      console.error("Error upgrading energy after multiple attempts:", error);
      io.emit("energyUpgraded", { success: false });
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

      const score = user.score + (buffer[tgUserId] || 0) * (user.clickPower + user.level - 1);

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
        const clickPower = user.clickPower;
        let clickCount = 0;

        const currentTime = new Date().getTime();
        const timeDiff = (currentTime - user.lastOnlineTimeStamp) / 1000;
        const restoredEnergy = timeDiff / 2;
        const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);

        clickCount = Math.min(user.energy + restoredEnergy - buffer[tgUserId], userMaxEnergy);

        clickCount = Math.min(user.energy + restoredEnergy - buffer[tgUserId], userMaxEnergy);
        clickCount = Math.max(clickCount, 0);

        const balanceIncrement = buffer[tgUserId] * (clickPower + user.level - 1);

        try {
          await appDataSource.getRepository(User).update(
            { tgId: tgUserId },
            {
              balance: () => `balance + ${balanceIncrement}`,
              score: () => `score + ${balanceIncrement}`,
              lastOnlineTimeStamp: currentTime,
              energy: clickCount,
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
      const restoredEnergy = timeDiff / 2;
      const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);

      clickCount = Math.min(user.energy + restoredEnergy, userMaxEnergy);

      if (0 > clickCount) {
        clickCount = 0;
      }

      console.log(restoredEnergy);

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
