import { User, Task, League, Business } from "./models.js";
import { getAppSettings } from "./admin.js";
import { mongoose } from "mongoose";
import { getLang } from "./getLang.js";
import { config } from "./core/config.js";

export let buffer = {};

export const initSocketsLogic = (io) => ({
  clickEvent: async (data) => {
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
  checkTaskStatus: async (data) => {
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 1000;

    while (attempts < maxAttempts) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const parsedData = JSON.parse(data);
        const [tgUserId, taskId] = parsedData;

        const task = await Task.findById(taskId).session(session);
        if (!task) {
          await session.abortTransaction();
          session.endSession();
          return;
        }

        const user = await User.findOne({ tgId: tgUserId }).session(session);
        if (!user) {
          await session.abortTransaction();
          session.endSession();
          return;
        }

        if (
          user.completedTasks.find((ut) => ut.toString() === task.id.toString())
        ) {
          await session.abortTransaction();
          session.endSession();
          return;
        }

        if (task.type === "telegram") {
          const slices = task.activateUrl.split("/");
          const tgChatId = slices[slices.length - 1];

          const res = await fetch(
            `https://api.telegram.org/bot${config.TG_BOT_TOKEN}/getChatMember?chat_id=@${tgChatId}&user_id=${tgUserId}`
          );
          const data = await res.json();

          if (
            data.ok &&
            data.result &&
            data.result.status &&
            data.result.status !== "left" &&
            data.result.status !== "kicked"
          ) {
            user.completedTasks.push(task);

            await User.findOneAndUpdate(
              { tgId: user.tgId },
              {
                $inc: { balance: task.rewardAmount, score: task.rewardAmount },
              },
              { session } // Обновление в рамках текущей сессии
            );
            io.emit("reward", task.rewardAmount);

            await user.save({ session });

            await session.commitTransaction();
            session.endSession();
            io.emit("taskStatus", { id: task.id, finished: true });
          } else {
            await session.abortTransaction();
            session.endSession();
            io.emit("taskStatus", { id: task.id, finished: false });
          }
        } else {
          user.completedTasks.push(task);

          await User.findOneAndUpdate(
            { tgId: user.tgId },
            {
              $inc: { balance: task.rewardAmount, score: task.rewardAmount },
            },
            { session } // Обновление в рамках текущей сессии
          );

          io.emit("reward", task.rewardAmount);

          await user.save({ session });

          await session.commitTransaction();
          session.endSession();
          io.emit("taskStatus", { id: task.id, finished: true });
        }
        break; // Если транзакция прошла успешно, выходим из цикла
      } catch (error) {
        await session.abortTransaction();
        session.endSession();

        if (attempts < maxAttempts - 1) {
          console.warn(
            `Attempt ${attempts + 1} failed. Retrying in ${
              retryDelay / 1000
            } seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error(
            "Error checking task status after multiple attempts:",
            error
          );
        }
      }

      attempts++;
    }
  },
  getUser: async (userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tgUserId = Number(userId);
      let user;

      while (true) {
        try {
          user = await User.findOne({ tgId: tgUserId })
            .populate({
              path: "referrals",
              options: {
                limit: 15,
              },
            })
            .populate("businesses")
            .populate("completedTasks");

          break;
        } catch {
          console.log("Retry");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!user) {
        return;
      }

      const secondsOffline =
        (new Date().getTime() - user.lastOnlineTimestamp) / 1000;
      const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);
      const bufferClicks = buffer[tgUserId] || 0;
      const availableEnergy = userMaxEnergy - user.energy;

      const energyToRestore = Math.min(
        secondsOffline - bufferClicks,
        availableEnergy
      );
      const businesses = await Business.find({}).session(session).exec();

      const totalReward = user.businesses.reduce((sum, bId) => {
        const business = businesses.find(
          (b) => b._id.toString() === bId._id.toString()
        );
        if (!business) {
          console.error(
            "[FATAL]: Detected user with business that doesn't exist."
          );
          return sum;
        }

        const businessUpgrade = user.businessUpgrades.find(
          (bu) => bu.businessId.toString() === business._id.toString()
        );
        const businessLevel = businessUpgrade ? businessUpgrade.level : 1;
        const levelAdjustedReward =
          business.rewardPerHour * 1.2 ** businessLevel;
        const normalizedReward =
          user.lastOnlineTimestamp > Date.now() - 1000 * 60 * 60 * 3
            ? (levelAdjustedReward * secondsOffline) / 3600
            : levelAdjustedReward * 3;

        return sum + normalizedReward;
      }, 0);

      await User.updateOne(
        { tgId: tgUserId },
        {
          $inc: {
            balance: totalReward + bufferClicks * user.clickPower,
            score: totalReward + bufferClicks * user.clickPower,
            addedFromBusinesses: totalReward,
            energy: energyToRestore,
          },
          lastOnlineTimestamp: new Date().getTime(),
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      const leagues = await League.find({});
      let userLeague = leagues.find(
        (league) =>
          league.minScore <= user.score && league.maxScore >= user.score
      );
      if (!userLeague) {
        userLeague = leagues[leagues.length - 1];
      }
      const userLevel =
        leagues
          .sort((a, b) => a.minScore - b.minScore)
          .findIndex((l) => l._id.toString() === userLeague._id.toString()) + 1;
      const userPlaceInLeague = await User.countDocuments({
        score: { $lte: userLeague.maxScore, $gte: user.score },
      });

      const totalIncomePerHour = user.businesses.reduce((sum, b) => {
        const businessUpgrade = user.businessUpgrades.find(
          (bu) => bu.businessId.toString() === b._id.toString()
        );
        const businessLevel = businessUpgrade ? businessUpgrade.level : 1;
        return sum + b.rewardPerHour * 1.2 ** businessLevel;
      }, 0);

      const userData = {
        id: user._id,
        ...user.toObject(),
        balance: user.balance + (buffer[tgUserId] || 0) * user.clickPower,
        score: user.score + (buffer[tgUserId] || 0) * user.clickPower,
        referrals: user.referrals.map((r) => ({ id: r._id, ...r.toObject() })),
        clickPower: user.clickPower,
        userPlaceInLeague: userPlaceInLeague + 1,
        totalIncomePerHour,
        completedTasks: user.completedTasks.map((t) => ({
          id: t._id,
          ...t.toObject(),
        })),
        league: { id: userLeague._id, ...userLeague.toObject() },
        userLevel,
        maxLevel: leagues.length,
        energyLevel: user.energyLevel - (buffer[tgUserId] || 0),
        maxEnergy: 1000 + 500 * (user.energyLevel - 1),
        energy: +(user.energy - (buffer[user._id] || 0))
          .toString()
          .split(".")[0],
      };

      io.emit("user", userData);
    } catch {
      console.log("error on getting user");
    }
  },
  getLeagueInfo: async ({ leagueId, topUsersCount }) => {
    try {
      const leagues = await League.find({});

      const league = await League.findOne({ _id: leagueId });

      const lastLeague = leagues[leagues.length - 1].id == league.id;

      if (!league) {
        return;
      }

      let usersInLeague = await User.countDocuments({
        score: { $lte: league.maxScore, $gte: league.minScore },
      });

      let topUsersInLeague = await User.find({
        score: { $lte: league.maxScore, $gte: league.minScore },
      })
        .sort({ score: -1 })
        .limit(topUsersCount);

      if (lastLeague) {
        usersInLeague += await User.countDocuments({
          score: { $gte: league.minScore },
        });
        const dopUsers = await User.find({
          score: { $gte: league.maxScore },
        })
          .sort({ score: -1 })
          .limit(topUsersCount);
        topUsersInLeague = [...dopUsers, ...topUsersInLeague];
      }
      io.emit("league", {
        league: { id: league._id, ...league },
        usersInLeague,
        topUsersInLeague,
      });
    } catch {
      console.log("error get league");
    }
  },
  getBusinessesToBuy: async (userTgId) => {
    const user = await User.findOne({ tgId: userTgId });
    const businesses = await Business.find({ isDeleted: false });

    const finalBusinesses = businesses.map((b) => {
      const businessUpgrade = user.businessUpgrades.find(
        (bu) => bu.businessId.toString() === b._id.toString()
      );
      const businessLevel = businessUpgrade
        ? businessUpgrade.level
        : user.businesses.some((bu) => bu.toString() == b._id.toString())
        ? 1
        : 0;

      return {
        ...b.toObject(),
        rewardPerHour: b.rewardPerHour * 1.2 ** (businessLevel + 1),
        addedRewardPerHour:
          b.rewardPerHour * 1.2 ** (businessLevel + 1) -
          b.rewardPerHour * 1.2 ** businessLevel,
        price: b.price * 1.2 ** businessLevel,
        level: businessLevel,
        lastUpgradeTimestamp: businessUpgrade
          ? businessUpgrade.timestamp
          : null,
      };
    });

    io.emit("businesses", finalBusinesses);
  },
  buyBusiness: async (data) => {
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 950;
    const parsedData = JSON.parse(data);
    const [userTgId, businessId] = parsedData;

    while (attempts < maxAttempts) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        let user;
        while (true) {
          try {
            user = await User.findOne({ tgId: userTgId }).session(session);
            break;
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        const business = await Business.findById(businessId).session(session);

        if (
          !user ||
          business.refsToUnlock > user.businesses.length ||
          business.price > user.balance + (buffer[userTgId] || 0)
        ) {
          console.log("Недостаточно средств или бизнес заблокирован");
          await session.abortTransaction();
          session.endSession();
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }

        const appSettings = await getAppSettings();

        const comboMatch =
          appSettings.comboBusinesses.some((c) => c._id == businessId) &&
          user.currentComboCompletions.length < 3 &&
          !user.currentComboCompletions.includes(businessId);
        const comboCompleted =
          comboMatch && user.currentComboCompletions.length == 2;

        user.balance -= business.price;
        user.businesses.push(business._id);

        if (comboMatch) {
          user.currentComboCompletions.push(businessId);
        }

        if (comboCompleted) {
          user.balance += appSettings.comboReward;
          io.emit("comboCompleted", { reward: appSettings.comboReward });
        }

        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        const updatedUser = await User.findOne({ tgId: userTgId }).populate(
          "businesses businessUpgrades referrals completedTasks"
        );

        const businesses = await Business.find({
          _id: { $in: updatedUser.businesses },
        });

        const totalIncomePerHour = businesses.reduce((sum, b) => {
          const businessUpgrade = updatedUser.businessUpgrades.find(
            (bu) => bu.businessId.toString() === b._id.toString()
          );
          const businessLevel = businessUpgrade ? businessUpgrade.level : 1;
          return sum + b.rewardPerHour * 1.2 ** businessLevel;
        }, 0);

        const currentComboBusinesses = businesses.filter((b) =>
          user.currentComboCompletions.includes(b._id.toString())
        );

        io.emit("liteSync", {
          balance: updatedUser.balance,
          score: updatedUser.score,
          energy: updatedUser.energy,
          newBusinesses: businesses,
          totalIncomePerHour: totalIncomePerHour,
          currentComboCompletions: comboMatch ? currentComboBusinesses : null,
        });

        io.emit("businessBought", { success: true, id: businessId });
        break;
      } catch (error) {
        await session.abortTransaction();
        session.endSession();

        if (attempts < maxAttempts - 1) {
          console.warn(
            `Попытка ${attempts + 1} не удалась. Повтор через ${
              retryDelay / 1000
            } секунд...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error(
            "Ошибка при покупке бизнеса после нескольких попыток:",
            error
          );
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }
      }
      attempts++;
    }
  },

  getTasks: async () => {
    const tasks = await Task.find({ active: true });
    io.emit("tasks", tasks);
  },
  activateBoost: async (data) => {
    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
      const session = await mongoose.startSession();
      const parsedData = JSON.parse(data);
      const [tgUserId, boostName, lang] = parsedData;

      try {
        session.startTransaction();

        const dayMs = 1000 * 60 * 60 * 24;
        const appSettings = await getAppSettings();
        const user = await User.findOne({ tgId: tgUserId }).session(session);
        if (!user) {
          throw new Error("User not found");
        }

        if (boostName === "fullEnergyBoost") {
          if (
            !user.lastFullEnergyTimestamp ||
            user.lastFullEnergyTimestamp + dayMs < Date.now()
          ) {
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
          if (
            !user.lastDailyRewardTimestamp ||
            user.lastDailyRewardTimestamp + dayMs < Date.now()
          ) {
            user.lastDailyRewardTimestamp = Date.now();
            await User.findOneAndUpdate(
              { tgId: user.tgId },
              {
                $inc: {
                  balance: appSettings.dailyReward,
                  score: appSettings.dailyReward,
                },
              },
              { session } // Обновление в рамках текущей сессии
            );

            io.emit("reward", appSettings.dailyReward);
            io.emit("boostActivated", {
              success: true,
              message: `${getLang(lang, "youReceived")} ${appSettings.dailyReward} ${getLang("", "coins")}`,
            });
          } else {
            io.emit("boostActivated", {
              success: false,
              message: getLang(lang, "dailyRewardAlready"),
            });
          }
        }

        await user.save({ session });
        await session.commitTransaction();
        session.endSession();
        return; // Успешное завершение, выходим из функции
      } catch {
        await session.abortTransaction();
        session.endSession();

        attempt++;
        if (attempt < maxRetries) {
          console.log(`Retrying transaction (${attempt}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Ждем перед повторной попыткой
        } else {
          console.log("Max retry attempts reached. Transaction failed.");
          io.emit("boostActivated", {
            success: false,
            message: getLang(lang, "transactionFailed"),
          });
          break;
        }
      } finally {
        session.endSession();
      }
    }
  },

  upgradeClick: async (userId) => {
    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const user = await User.findOne({ tgId: userId }).session(session);
        if (!user) {
          throw new Error("User not found");
        }

        const appSettings = await getAppSettings();
        if (!appSettings) {
          throw new Error("App settings not found");
        }

        if (user.clickPower >= appSettings.maxClickLevel) {
          throw new Error("Max click power level reached");
        }

        const cost =
          appSettings.startClickUpgradeCost * 2 ** (user.clickPower - 1);
        if (user.balance < cost) {
          throw new Error("Insufficient balance");
        }

        const updatedUserData = {
          balance: user.balance - cost,
          score: user.score,
          clickPower: user.clickPower + 1,
        };

        await User.findOneAndUpdate(
          { tgId: user.tgId },
          { $inc: { balance: -cost, clickPower: 1 } },
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        io.emit("clickPowerUpgraded", { success: true });

        const liteSyncData = {
          ...user.toObject(),
          balance: updatedUserData.balance,
          score: updatedUserData.score,
          clickPower: updatedUserData.clickPower,
        };

        io.emit("liteSync", liteSyncData);

        return;
      } catch {
        await session.abortTransaction();
        session.endSession();

        attempt++;
        if (attempt < maxRetries) {
          console.log(`Retrying transaction (${attempt}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          console.log("Max retry attempts reached. Transaction failed.");
          io.emit("clickPowerUpgraded", { success: false });
          break;
        }
      } finally {
        session.endSession();
      }
    }
  },

  upgradeBusiness: async (data) => {
    let attempts = 0;
    const maxAttempts = 10; // Максимальное количество попыток
    const retryDelay = 950; // Задержка между попытками (в миллисекундах)
    const parsedData = JSON.parse(data);
    const [userTgId, businessId] = parsedData;

    while (attempts < maxAttempts) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Читаем пользователя в транзакции
        let user;
        while (true) {
          try {
            user = await User.findOne({ tgId: userTgId }).session(session);
            break;
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Проверяем, есть ли у пользователя бизнес
        if (
          !user.businesses.some((b) => b.toString() === businessId.toString())
        ) {
          console.warn(
            `User ${userTgId} tried to upgrade business ${businessId} but doesn't have it`
          );
          await session.abortTransaction();
          session.endSession();
          return;
        }

        const business = await Business.findById(businessId).session(session);
        const businessUpgrade = user.businessUpgrades?.find(
          (b) => b.businessId.toString() === businessId.toString()
        );

        // Проверка таймера апгрейда
        if (
          businessUpgrade &&
          businessUpgrade.timestamp +
            5 * 1.6 ** (businessUpgrade.level - 3) * 1000 * 60 >
            Date.now()
        ) {
          await session.abortTransaction();
          session.endSession();
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }

        // Проверка уровня
        if (businessUpgrade && (businessUpgrade.level || 0) >= 10) {
          await session.abortTransaction();
          session.endSession();
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }

        const newLevel = businessUpgrade ? businessUpgrade.level + 1 : 2;
        const finalPrice = Math.round(business.price * 1.2 ** (newLevel - 1));

        // Проверка баланса
        if (user.balance + (buffer[userTgId] || 0) < finalPrice) {
          await session.abortTransaction();
          session.endSession();
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }

        // Обновляем баланс и уровень бизнеса пользователя
        const currentVersion = user.version; // Сохраняем текущую версию
        user.balance -= finalPrice;
        user.version += 1; // Увеличиваем версию

        if (!businessUpgrade) {
          user.businessUpgrades.push({
            businessId,
            level: newLevel,
            timestamp: newLevel >= 3 ? Date.now() : null,
          });
        } else {
          businessUpgrade.level = newLevel;
          businessUpgrade.timestamp = newLevel >= 3 ? Date.now() : null;
        }

        const appSettings = await getAppSettings();
        const comboMatch =
          appSettings.comboBusinesses.some((c) => c._id == businessId) &&
          user.currentComboCompletions.length < 3 &&
          !user.currentComboCompletions.includes(businessId);
        const comboCompleted =
          comboMatch && user.currentComboCompletions.length === 2;

        if (comboMatch) {
          user.currentComboCompletions.push(businessId);
        }

        if (comboCompleted) {
          user.balance += appSettings.comboReward;
          io.emit("comboCompleted", { reward: appSettings.comboReward });
        }

        // Попытка сохранить с проверкой версии
        const result = await User.updateOne(
          { tgId: userTgId, version: currentVersion }, // Проверяем, совпадает ли версия
          {
            $set: { balance: user.balance, version: user.version },
            $push: { businessUpgrades: user.businessUpgrades },
          },
          { session }
        );

        if (result.nModified === 0) {
          // Несоответствие версии, повторяем попытку
          await session.abortTransaction();
          session.endSession();
          attempts++;
          continue; // Повторяем транзакцию
        }

        await session.commitTransaction();
        session.endSession();
        io.emit("businessBought", { success: true, id: businessId });

        // Дополнительная логика доходов от бизнеса...
        const businesses = await Business.find({
          _id: { $in: user.businesses },
        });
        const totalIncomePerHour = businesses.reduce((sum, b) => {
          const businessUpgrade = user.businessUpgrades.find(
            (bu) => bu.businessId.toString() === b._id.toString()
          );
          const businessLevel = businessUpgrade ? businessUpgrade.level : 1;
          return sum + b.rewardPerHour * 1.2 ** businessLevel;
        }, 0);

        const currentComboBusinesses = businesses.filter((b) =>
          user.currentComboCompletions.includes(b._id.toString())
        );

        const liteSyncData = {
          ...user.toObject(),
          balance: user.balance,
          businesses: user.businesses,
          businessUpgrades: user.businessUpgrades,
          currentComboCompletions: comboMatch ? currentComboBusinesses : null,
          totalIncomePerHour: totalIncomePerHour,
        };

        io.emit("liteSync", liteSyncData);

        break;
      } catch (error) {
        await session.abortTransaction();
        session.endSession();

        if (attempts < maxAttempts - 1) {
          console.warn(
            `Attempt ${attempts + 1} failed. Retrying in ${
              retryDelay / 1000
            } seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error(
            "Error upgrading business after multiple attempts:",
            error
          );
          io.emit("businessBought", { success: false, id: businessId });
          return;
        }
      }
      attempts++;
    }
  },

  upgradeEnergy: async (userId) => {
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 1000;

    while (attempts < maxAttempts) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const user = await User.findOne({ tgId: userId }).session(session);
        if (!user) {
          await session.abortTransaction();
          session.endSession();
          io.emit("energyUpgraded", { success: false });
          return;
        }

        const appSettings = await getAppSettings();
        if (!appSettings) {
          await session.abortTransaction();
          session.endSession();
          io.emit("energyUpgraded", { success: false });
          return;
        }

        if (user.energyLevel >= appSettings.maxEnergyLevel) {
          await session.abortTransaction();
          session.endSession();
          io.emit("energyUpgraded", { success: false });
          return;
        }

        const cost =
          appSettings.startEnergyUpgradeCost * 2 ** (user.energyLevel - 1);
        if (user.balance + (buffer[userId] || 0) < cost) {
          await session.abortTransaction();
          session.endSession();
          io.emit("energyUpgraded", { success: false });
          return;
        }

        // Обновляем баланс и уровень энергии пользователя в одной операции
        user.balance -= cost;
        user.energyLevel += 1;

        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        io.emit("energyUpgraded", { success: true });

        const liteSyncData = {
          ...user.toObject(),
          balance: user.balance,
          energyLevel: user.energyLevel,
          score: user.score,
        };

        io.emit("liteSync", liteSyncData); // Передаем обновленные данные
        break; // Выходим из цикла при успешном завершении
      } catch (error) {
        await session.abortTransaction();
        session.endSession();

        if (attempts < maxAttempts - 1) {
          console.warn(
            `Attempt ${attempts + 1} failed. Retrying in ${
              retryDelay / 1000
            } seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error(
            "Error upgrading energy after multiple attempts:",
            error
          );
          io.emit("energyUpgraded", { success: false });
        }
      }

      attempts++;
    }
  },
  userLeague: async (userId) => {
    try {
      const tgUserId = Number(userId);
      let user;
      while (true) {
        try {
          user = await User.findOne({ tgId: tgUserId })
            .populate({
              path: "referrals",
              options: {
                limit: 15,
              },
            })
            .populate("businesses")
            .populate("completedTasks");

          break;
        } catch {
          console.log("Retry");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      const leagues = await League.find({});
      const score = user.score + (buffer[tgUserId] || 0) * user.clickPower;
      let userLeague = leagues.find(
        (league) => league.minScore <= score && league.maxScore >= score
      );

      if (!userLeague) {
        userLeague = leagues[leagues.length - 1];
      }

      const userLevel =
        leagues
          .sort((a, b) => a.minScore - b.minScore)
          .findIndex((l) => l._id.toString() === userLeague._id.toString()) + 1;

      const userPlaceInLeague = await User.countDocuments({
        score: { $lte: userLeague.maxScore, $gte: user.score },
      });
      io.emit("userLeague", { userLeague, userPlaceInLeague, userLevel });
    } catch (e) {
      console.error(e);
    }
  },
});

export const handleSocketConnection = async (socket) => {
  registerEvents(socket);

  const userId = socket.handshake.query.user_id;
  socket.userId = userId;
};

export const registerEvents = (io) => {
  const socketsLogic = initSocketsLogic(io);

  io.on("clickEvent", socketsLogic.clickEvent);
  io.on("checkTaskStatus", socketsLogic.checkTaskStatus);
  io.on("getUser", socketsLogic.getUser);
  io.on("getLeagueInfo", socketsLogic.getLeagueInfo);
  io.on("getBusinessesToBuy", socketsLogic.getBusinessesToBuy);
  io.on("buyBusiness", socketsLogic.buyBusiness);
  io.on("getTasks", socketsLogic.getTasks);
  io.on("activateBoost", socketsLogic.activateBoost);
  io.on("upgradeClick", socketsLogic.upgradeClick);
  io.on("upgradeBusiness", socketsLogic.upgradeBusiness);
  io.on("upgradeEnergy", socketsLogic.upgradeEnergy);
  io.on("userLeague", socketsLogic.userLeague);

  io.on("disconnect", async () => {
    const tgUserId = Number(io.userId);
    const user = await User.findOne({ tgId: tgUserId });

    if (buffer[tgUserId] > 0) {
      if (user) {
        const clickPower = user.clickPower;
        let clickCount = 0;

        const currentTime = new Date().getTime();
        const timeDiff = (currentTime - user.lastOnlineTimestamp) / 1000;
        const restoredEnergy = timeDiff;
        const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);

        clickCount = Math.min(
          user.energy + restoredEnergy - buffer[tgUserId],
          userMaxEnergy
        );

        if (0 > clickCount) {
          clickCount = 0;
        }

        console.log(clickCount);

        const balanceIncrement = buffer[tgUserId] * clickPower;

        try {
          await User.findOneAndUpdate(
            { tgId: tgUserId },
            {
              $inc: {
                balance: balanceIncrement,
                score: balanceIncrement,
              },
              $set: {
                lastOnlineTimestamp: currentTime,
                energy: clickCount,
              },
            }
          );

          delete buffer[tgUserId];
        } catch (error) {
          console.error(
            "Ошибка обновления пользователя при отключении:",
            error
          );
        }
      }
    } else {
      let clickCount = 0;

      const currentTime = new Date().getTime();
      const timeDiff = (currentTime - user.lastOnlineTimestamp) / 1000;
      const restoredEnergy = timeDiff;
      const userMaxEnergy = 1000 + 500 * (user.energyLevel - 1);

      clickCount = Math.min(user.energy + restoredEnergy, userMaxEnergy);

      if (0 > clickCount) {
        clickCount = 0;
      }

      console.log(restoredEnergy);

      try {
        await User.findOneAndUpdate(
          { tgId: tgUserId },
          { lastOnlineTimestamp: new Date().getTime(), energy: clickCount }
        );
      } catch (error) {
        console.error(
          "Ошибка обновления времени последнего подключения:",
          error
        );
      }
    }
  });
};
