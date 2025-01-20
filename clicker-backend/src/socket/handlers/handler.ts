import { Socket } from "socket.io";
import { Between, MoreThan, In } from "typeorm";
import { appDataSource } from "../../core/database";
import { getLang } from "../../getLang";
import { Business } from "../../models/business";
import { League } from "../../models/league";
import { Task } from "../../models/task";
import { User } from "../../models/user";
import { getAppSettingsWithBusinesses } from "../../services/appSettingsService";
import { config } from "../../core/config";

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
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 1000;

    while (attempts < maxAttempts) {
      const connection = await appDataSource.getRepository(User).manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.startTransaction();

      try {
        const parsedData = JSON.parse(data);
        const [tgUserId, taskId] = parsedData;

        const task = await queryRunner.manager.findOneBy(Task, {
          id: taskId,
        });
        if (!task) {
          await queryRunner.rollbackTransaction();
          return;
        }

        const user = await queryRunner.manager.findOne(User, {
          where: { tgId: tgUserId },
          relations: ["completedTasks"],
        });
        if (!user) {
          await queryRunner.rollbackTransaction();
          return;
        }

        if (user.completedTasks.some((ut) => ut.id === task.id)) {
          await queryRunner.rollbackTransaction();
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

            await queryRunner.manager.save(user);
            await queryRunner.commitTransaction();
            io.emit("reward", task.rewardAmount);
            io.emit("taskStatus", { id: task.id, finished: true });
          } else {
            await queryRunner.rollbackTransaction();
            io.emit("taskStatus", { id: task.id, finished: false });
          }
        }
        break;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        if (attempts < maxAttempts - 1) {
          console.warn(`Attempt ${attempts + 1} failed. Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error("Error checking task status after multiple attempts:", error);
        }
      } finally {
        await queryRunner.release();
      }
      attempts++;
    }
  },
  getUser: async (userId: string) => {
    const connection = await appDataSource.getRepository(User).manager.connection;
    const queryRunner = connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const tgUserId = Number(userId);
      let user;

      while (true) {
        try {
          user = await queryRunner.manager.findOne(User, {
            where: { tgId: tgUserId },
            relations: ["referrals", "businesses", "completedTasks", "businessUpgrades", "league"],
          });

          break;
        } catch {
          console.log("Retry");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!user) {
        return;
      }

      const secondsOffline = (new Date().getTime() - user.lastOnlineTimeStamp) / 1000;
      const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);
      const bufferClicks = buffer[tgUserId] || 0;
      const availableEnergy = userMaxEnergy - user.energy;

      const energyToRestore = Math.min(secondsOffline - bufferClicks, availableEnergy);
      const businesses = await queryRunner.manager.find(Business);

      const totalReward = user.businesses.reduce((sum, business) => {
        const businessUpgrade = user.businessUpgrades.find((bu) => bu.business.id === business.id);
        const businessLevel = businessUpgrade ? businessUpgrade.level : 1;
        const levelAdjustedReward = business.rewardPerHour * 1.2 ** businessLevel;
        const normalizedReward =
          user.lastOnlineTimeStamp > Date.now() - 1000 * 60 * 60 * 3
            ? (levelAdjustedReward * secondsOffline) / 3600
            : levelAdjustedReward * 3;
        return sum + normalizedReward;
      }, 0);

      await queryRunner.manager.update(
        User,
        { tgId: tgUserId },
        {
          balance: user.balance + totalReward + bufferClicks * user.clickPower,
          score: user.score + totalReward + bufferClicks * user.clickPower,
          addedFromBusinesses: totalReward,
          energy: user.energy + energyToRestore,
          lastOnlineTimeStamp: new Date().getTime(),
        },
      );

      await queryRunner.commitTransaction();

      const leagues = await queryRunner.manager.find(League);
      const userLeague =
        leagues.find((league) => league.minScore <= user.score && league.maxScore >= user.score) ||
        leagues[leagues.length - 1];

      const userLevel = leagues.sort((a, b) => a.minScore - b.minScore).findIndex((l) => l.id === userLeague.id) + 1;

      const userPlaceInLeague = await queryRunner.manager.count(User, {
        where: {
          score: Between(user.score, userLeague.maxScore),
        },
      });

      const totalIncomePerHour = user.businesses.reduce((sum, business) => {
        const businessUpgrade = user.businessUpgrades.find((bu) => bu.business.id === business.id);
        const businessLevel = businessUpgrade ? businessUpgrade.level : 1;
        return sum + business.rewardPerHour * 1.2 ** businessLevel;
      }, 0);

      io.emit("user", {
        id: user.tgId,
        ...user,
        balance: user.balance + (buffer[tgUserId] || 0) * user.clickPower,
        score: user.score + (buffer[tgUserId] || 0) * user.clickPower,
        referrals: user.referrals,
        clickPower: user.clickPower,
        userPlaceInLeague: userPlaceInLeague + 1,
        totalIncomePerHour,
        completedTasks: user.completedTasks,
        league: userLeague,
        userLevel,
        maxLevel: leagues.length,
        energyLevel: user.energyLevel - (buffer[tgUserId] || 0),
        maxEnergy: 1000 + 500 * (user.energyLevel - 1),
        energy: user.energy - (buffer[tgUserId] || 0),
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error getting user:", error);
    } finally {
      await queryRunner.release();
    }
  },
  getLeagueInfo: async ({ leagueId, topUsersCount }: { leagueId: string; topUsersCount: number }) => {
    try {
      const leagueRepository = await appDataSource.getRepository(League);
      const userRepository = await appDataSource.getRepository(User);

      const leagues = await leagueRepository.find();
      const league = await leagueRepository.findOneBy({
        id: +leagueId,
      });
      if (!league) return;

      const lastLeague = leagues[leagues.length - 1].id === league.id;
      let usersInLeague = await userRepository.count({
        where: { score: Between(league.minScore, league.maxScore) },
      });

      let topUsersInLeague = await userRepository.find({
        where: { score: Between(league.minScore, league.maxScore) },
        order: { score: "DESC" },
        take: topUsersCount,
      });

      if (lastLeague) {
        usersInLeague += await userRepository.count({ where: { score: MoreThan(league.minScore) } });
        const dopUsers = await userRepository.find({
          where: { score: MoreThan(league.maxScore) },
          order: { score: "DESC" },
          take: topUsersCount,
        });
        topUsersInLeague = [...dopUsers, ...topUsersInLeague];
      }

      io.emit("league", { league, usersInLeague, topUsersInLeague });
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
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 950;
    const parsedData = JSON.parse(data);
    const [userTgId, businessId] = parsedData;

    while (attempts < maxAttempts) {
      const connection = await appDataSource.getRepository(User).manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.startTransaction();

      try {
        const user = await queryRunner.manager.findOneOrFail(User, {
          where: { tgId: userTgId },
          relations: ["businesses", "businessUpgrades", "currentComboCompletions"],
        });
        const business = await queryRunner.manager.findOneOrFail(Business, { where: { id: businessId } });

        if (
          !user ||
          business.refsToUnlock > user.businesses.length ||
          business.price > user.balance + (buffer[userTgId] || 0)
        ) {
          console.log("Недостаточно средств или бизнес заблокирован");
          await queryRunner.rollbackTransaction();
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

        await queryRunner.manager.save(user);
        await queryRunner.commitTransaction();

        const updatedUser = await queryRunner.manager.findOneOrFail(User, {
          where: { tgId: userTgId },
          relations: ["businesses", "businessUpgrades", "referrals", "completedTasks"],
        });

        const businesses = await queryRunner.manager.find(Business, {
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

        await queryRunner.commitTransaction();
        io.emit("businessBought", { success: true, id: businessId });
        break;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        if (attempts < maxAttempts - 1) {
          console.warn(`Попытка ${attempts + 1} не удалась. Повтор через ${retryDelay / 1000} секунд...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error("Ошибка при покупке бизнеса после нескольких попыток:", error);
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }
      } finally {
        await queryRunner.release();
      }
      attempts++;
    }
  },

  getTasks: async () => {
    const tasks = await appDataSource.getRepository(Task).find({ where: { active: true } });
    io.emit("tasks", tasks);
  },
  activateBoost: async (data: string) => {
    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
      const connection = await appDataSource.getRepository(User).manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.startTransaction();
      const parsedData = JSON.parse(data);
      const [tgUserId, boostName, lang] = parsedData;

      try {
        const dayMs = 1000 * 60 * 60 * 24;
        const appSettings = await getAppSettingsWithBusinesses();
        const user = await queryRunner.manager.findOne(User, { where: { tgId: tgUserId } });
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

        await queryRunner.manager.save(user);
        await queryRunner.commitTransaction();
        return; // Успешное завершение, выходим из функции
      } catch {
        await queryRunner.rollbackTransaction();
        attempt++;
        if (attempt < maxRetries) {
          console.log(`Retrying transaction (${attempt}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          console.error("Max retry attempts reached. Transaction failed.");
          io.emit("boostActivated", { success: false, message: getLang(lang, "transactionFailed") });
        }
      } finally {
        await queryRunner.release();
      }
    }
  },

  upgradeClick: async (userId: number) => {
    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
      const connection = await appDataSource.getRepository(User).manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.startTransaction();
      try {
        const user = await queryRunner.manager.findOne(User, { where: { tgId: userId } });
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

        await queryRunner.manager.save(user);
        await queryRunner.commitTransaction();

        io.emit("clickPowerUpgraded", { success: true });
        io.emit("liteSync", { balance: user.balance, score: user.score, clickPower: user.clickPower });
        return;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        attempt++;
        if (attempt < maxRetries) {
          console.log(`Retrying transaction (${attempt}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          console.log("Max retry attempts reached. Transaction failed.");
          io.emit("clickPowerUpgraded", { success: false });
        }
      } finally {
        await queryRunner.release();
      }
    }
  },

  upgradeBusiness: async (data: string) => {
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 950;
    const parsedData = JSON.parse(data);
    const [userTgId, businessId] = parsedData;

    while (attempts < maxAttempts) {
      const connection = await appDataSource.getRepository(User).manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.startTransaction();

      try {
        const user = await queryRunner.manager.findOneOrFail(User, { where: { tgId: userTgId }, relations: ["businesses", "businessUpgrades", "currentComboCompletions"] });
        const business = await queryRunner.manager.findOneOrFail(Business, { where: { id: businessId } });

        if (!user.businesses.some((b) => b.id === business.id)) {
          await queryRunner.rollbackTransaction();
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }

        const businessUpgrade = user.businessUpgrades.find((bu) => bu.business.id === business.id)!;
        if (businessUpgrade && businessUpgrade.level >= 10) {
          await queryRunner.rollbackTransaction();
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }

        const newLevel = businessUpgrade ? businessUpgrade.level + 1 : 2;
        const finalPrice = Math.round(business.price * 1.2 ** (newLevel - 1));

        if (user.balance < finalPrice) {
          await queryRunner.rollbackTransaction();
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }

        user.balance -= finalPrice;

        if (!businessUpgrade) {
          user.businessUpgrades.push({ business, level: newLevel, timestamp: newLevel >= 3 ? Date.now() : 0, user, id: 1 });
        } else {
          businessUpgrade.level = newLevel;
          businessUpgrade.timestamp = newLevel >= 3 ? Date.now() : 0;
        }

        await queryRunner.manager.save(user);
        await queryRunner.commitTransaction();

        io.emit("businessBought", { success: true, id: businessId });
        break;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        attempts++;
        if (attempts < maxAttempts) {
          console.warn(`Attempt ${attempts + 1} failed. Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error("Error upgrading business after multiple attempts:", error);
          io.emit("businessBought", { success: false, id: businessId });
        }
      } finally {
        await queryRunner.release();
      }
    }
  },

  upgradeEnergy: async (userId: number) => {
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 1000;

    while (attempts < maxAttempts) {
      const connection = await appDataSource.getRepository(User).manager.connection;
      const queryRunner = connection.createQueryRunner();
      await queryRunner.startTransaction();

      try {
        const user = await queryRunner.manager.findOne(User, { where: { tgId: userId } });
        if (!user) {
          await queryRunner.rollbackTransaction();
          io.emit("energyUpgraded", { success: false });
          return;
        }

        const appSettings = await getAppSettingsWithBusinesses();
        if (!appSettings) {
          await queryRunner.rollbackTransaction();
          io.emit("energyUpgraded", { success: false });
          return;
        }

        if (user.energyLevel >= appSettings.maxEnergyLevel) {
          await queryRunner.rollbackTransaction();
          io.emit("energyUpgraded", { success: false });
          return;
        }

        const cost = appSettings.startEnergyUpgradeCost * 2 ** (user.energyLevel - 1);
        if (user.balance + (buffer[userId] || 0) < cost) {
          await queryRunner.rollbackTransaction();
          io.emit("energyUpgraded", { success: false });
          return;
        }

        // Обновляем баланс и уровень энергии пользователя в одной операции
        user.balance -= cost;
        user.energyLevel += 1;

        await queryRunner.manager.save(user);
        await queryRunner.commitTransaction();

        io.emit("energyUpgraded", { success: true });
        io.emit("liteSync", {
          balance: user.balance,
          energyLevel: user.energyLevel,
          score: user.score,
        });
        break;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        if (attempts < maxAttempts - 1) {
          console.warn(`Attempt ${attempts + 1} failed. Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error("Error upgrading energy after multiple attempts:", error);
          io.emit("energyUpgraded", { success: false });
        }
      } finally {
        await queryRunner.release();
      }
      attempts++;
    }
  },
  userLeague: async (userId: number) => {
    try {
      const tgUserId = Number(userId);
      const user = await appDataSource.getRepository(User).findOne({
        where: { tgId: tgUserId },
        relations: ["referrals", "businesses", "completedTasks"]
      });

      if (!user) return;

      const leagues = await appDataSource.getRepository(League).find();
      const score = user.score + (buffer[tgUserId] || 0) * user.clickPower;
      let userLeague = leagues.find(
        (league) => league.minScore <= score && league.maxScore >= score
      ) || leagues[leagues.length - 1];

      const userLevel =
        leagues
          .sort((a, b) => a.minScore - b.minScore)
          .findIndex((l) => l.id === userLeague.id) + 1;

      const userPlaceInLeague = await appDataSource.getRepository(User).count({
        where: {
          score: Between(userLeague.minScore, userLeague.maxScore),
        },
      });

      io.emit("userLeague", { userLeague, userPlaceInLeague, userLevel });
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
        const restoredEnergy = timeDiff;
        const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);

        clickCount = Math.min(user.energy + restoredEnergy - buffer[tgUserId], userMaxEnergy);

        clickCount = Math.min(user.energy + restoredEnergy - buffer[tgUserId], userMaxEnergy);
        clickCount = Math.max(clickCount, 0);

        const balanceIncrement = buffer[tgUserId] * clickPower;

        try {
          await appDataSource.getRepository(User).update(
            { tgId: tgUserId },
            {
              balance: () => `balance + ${balanceIncrement}`,
              score: () => `score + ${balanceIncrement}`,
              lastOnlineTimeStamp: currentTime,
              energy: clickCount,
            }
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
      const restoredEnergy = timeDiff;
      const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);

      clickCount = Math.min(user.energy + restoredEnergy, userMaxEnergy);

      if (0 > clickCount) {
        clickCount = 0;
      }

      console.log(restoredEnergy);

      try {
        await appDataSource.getRepository(User).update(
          { tgId: tgUserId },
          { lastOnlineTimeStamp: currentTime, energy: clickCount }
        );
      } catch (error) {
        console.error("Ошибка обновления времени последнего подключения:", error);
      }
    }
  }
});