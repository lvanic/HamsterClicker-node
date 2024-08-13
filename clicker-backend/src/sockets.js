import { User, Task, League, Business } from "./models.js";
import { getAppSettings } from "./admin.js";

export const initSocketsLogic = (io) => ({
  clickEvent: async (data) => {
    const parsedData = JSON.parse(data);
    const tgUserId = parsedData["user_id"];

    const user = await User.findOne({ tgId: tgUserId });
    if (user.balance === undefined || !user.energy === undefined) {
      user.balance = 0;
      user.energy = 1000;
    }

    if (user.energy <= 0) {
      return;
    }

    try {
      await User.findOneAndUpdate(
        { tgId: tgUserId },
        {
          $inc: {
            balance: user.clickPower,
            score: user.clickPower,
            energy: -1,
          },
          lastOnlineTimestamp: new Date().getTime(),
        }
      );
      await user.save();
    } catch (e) {
      console.error(e);
    }
  },
  checkTaskStatus: async (data) => {
    const parsedData = JSON.parse(data);
    const [tgUserId, taskId] = parsedData;

    const task = await Task.findById(taskId);
    if (!task) {
      return;
    }

    const user = await User.findOne({ tgId: tgUserId });
    if (!user) {
      return;
    }

    if (
      user.completedTasks.includes((ut) => ut.toString() == task.id.toString())
    ) {
      return;
    }

    if (task.type == "telegram") {
      const slices = task.activateUrl.split("/");
      const tgChatId = slices[slices.length - 1];

      const res = await fetch(
        `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/getChatMember?chat_id=@${tgChatId}&user_id=${tgUserId}`
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
          }
        );

        await user.save();
        io.emit("taskStatus", { id: task.id, finished: true });
      } else {
        io.emit("taskStatus", { id: task.id, finished: false });
      }
    } else {
      user.completedTasks.push(task);

      await User.findOneAndUpdate(
        { tgId: user.tgId },
        {
          $inc: { balance: task.rewardAmount },
        }
      );

      await user.save();
      io.emit("taskStatus", { id: task.id, finished: true });
    }
  },
  getUser: async (userId) => {
    const tgUserId = Number(userId);

    await User.findOneAndUpdate(
      { tgId: tgUserId },
      { lastOnlineTimestamp: new Date().getTime() }
    );

    const user = await User.findOne({ tgId: tgUserId })
      .populate("referrals")
      .populate("businesses")
      .populate("completedTasks");

    if (!user) {
      return;
    }

    const leagues = await League.find({});
    const userLeague = leagues.find(
      (league) => league.minScore <= user.score && league.maxScore >= user.score
    );
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
      const businessLevel = !!businessUpgrade ? businessUpgrade.level : 1;
      return sum + b.rewardPerHour * 2.2 ** (businessLevel - 1);
    }, 0);

    const userData = {
      id: user._id,
      ...user.toObject(),
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
      energyLevel: user.energyLevel,
      maxEnergy: 1000 + 500 * (user.energyLevel - 1),
    };

    io.emit("user", userData);
    io.on("disconnect", async () => {
      await User.findOneAndUpdate(
        { tgId: userId },
        { lastOnlineTimestamp: new Date().getTime() }
      );
    });
  },
  getLeagueInfo: async (leagueId, topUsersCount) => {
    const league = await League.findOne({ _id: leagueId });

    if (!league) {
      return;
    }

    const usersInLeague = await User.countDocuments({
      balance: { $lte: league.maxScore, $gte: league.minScore },
    });

    const topUsersInLeague = await User.find({
      balance: { $lte: league.maxScore, $gte: league.minScore },
    })
      .sort({ balance: -1 })
      .limit(topUsersCount);

    io.emit("league", {
      league: { id: league._id, ...league },
      usersInLeague,
      topUsersInLeague,
    });
  },
  getBusinessesToBuy: async (userTgId) => {
    const user = await User.findOne({ tgId: userTgId });
    const businesses = await Business.find({ isDeleted: false });

    const finalBusinesses = businesses.map((b) => {
      const businessUpgrade = user.businessUpgrades.find(
        (bu) => bu.businessId.toString() === b._id.toString()
      );
      const businessLevel = !!businessUpgrade
        ? businessUpgrade.level
        : user.businesses.some((bu) => bu.toString() == b._id.toString())
        ? 1
        : 0;

      return {
        ...b.toObject(),
        rewardPerHour: b.rewardPerHour * 2.2 ** businessLevel,
        price: b.price * 1.2 ** businessLevel,
        level: businessLevel,
        lastUpgradeTimestamp: !!businessUpgrade
          ? businessUpgrade.timestamp
          : null,
      };
    });

    io.emit("businesses", finalBusinesses);
  },
  buyBusiness: async (data) => {
    const parsedData = JSON.parse(data);
    const [userTgId, businessId] = parsedData;
    const user = await User.findOne({ tgId: userTgId });
    const business = await Business.findById(businessId);

    if (!user) {
      return;
    }
    if (business.refsToUnlock > user.businesses.length) {
      return;
    }
    if (business.price > user.balance) {
      return;
    }

    const appSettings = await getAppSettings();
    const comboMatch =
      appSettings.comboBusinesses.includes(businessId) &&
      user.currentComboCompletions.length < 3 &&
      !user.currentComboCompletions.includes(businessId);
    const comboCompleted =
      comboMatch && user.currentComboCompletions.length == 2;

    const updateQuery = {
      $inc: {
        balance: comboCompleted
          ? appSettings.comboReward - business.price
          : -business.price,
      },
      businesses: [...user.businesses, business._id],
    };
    if (comboMatch) {
      updateQuery.currentComboCompletions = [
        ...user.currentComboCompletions,
        businessId,
      ];
    }
    if (comboCompleted) {
      io.emit("comboCompleted", { reward: appSettings.comboReward });
    }

    await User.findOneAndUpdate({ tgId: user.tgId }, updateQuery);
    io.emit("businessBought", {
      success: true,
    });
  },
  getTasks: async () => {
    const tasks = await Task.find({ active: true });
    io.emit("tasks", tasks);
  },
  activateBoost: async (data) => {
    const parsedData = JSON.parse(data);
    const [tgUserId, boostName] = parsedData;

    const dayMs = 1000 * 60 * 60 * 24;
    const appSettings = await getAppSettings();
    const user = await User.findOne({ tgId: tgUserId });
    if (!user) {
      return;
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
        user.energy = user.maxEnergy;
        io.emit("boostActivated", "Your energy has been restored");
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
            $inc: { balance: appSettings.dailyReward },
          }
        );
        io.emit(
          "boostActivated",
          `You received a daily reward of ${appSettings.dailyReward} coins`
        );
      }
    }

    await user.save();
  },
  upgradeClick: async (userId) => {
    const user = await User.findOne({ tgId: userId });
    if (!user) {
      return;
    }

    const appSettings = await getAppSettings();
    if (!appSettings) {
      return;
    }

    if (user.clickPower >= appSettings.maxClickLevel) {
      return;
    }

    const cost = appSettings.startClickUpgradeCost * 2 ** (user.clickPower - 1);
    if (user.balance < cost) {
      return;
    }

    await User.findOneAndUpdate(
      { tgId: user.tgId },
      { $inc: { balance: -cost, clickPower: 1 } }
    );
  },
  subscribeLiteSync: async (userId) => {
    let lastUserInfo = await User.findOne({ tgId: userId });
    if (!lastUserInfo) {
      return;
    }

    const interval = setInterval(async () => {
      const newUserInfo = await User.findOne({ tgId: userId });
      let updatedInfo = {};
      let isBusinessAdded = false;
      let isBusinessUpgraded = false;

      if (lastUserInfo.businesses.length !== newUserInfo.businesses.length) {
        const businessIds = newUserInfo.businesses.filter(
          (b) => !lastUserInfo.businesses.includes(b)
        );

        const businesses = await Business.find({
          _id: { $in: businessIds },
        });
        updatedInfo.newBusinesses = businesses.map((b) => {
          const businessUpgrade = newUserInfo.businessUpgrades.find(
            (bu) => bu.businessId.toString() === b._id.toString()
          );
          const businessLevel = !!businessUpgrade ? businessUpgrade.level : 1;
          return {
            id: b._id,
            ...b.toObject(),
            lastUpgradeTimestamp: !!businessUpgrade
              ? businessUpgrade.timestamp
              : null,
            level: businessLevel,
          };
        });
        isBusinessAdded = true;
      }

      const newBusinessUpgrades = newUserInfo.businessUpgrades.filter((bu) => {
        const match = lastUserInfo.businessUpgrades.find(
          (b) => b.businessId.toString() == bu.businessId.toString()
        );
        return !!match ? match.level != bu.level : true;
      });
      if (newBusinessUpgrades.length > 0) {
        updatedInfo.businessUpgrades = newBusinessUpgrades;
        isBusinessUpgraded = true;
      }

      if (isBusinessAdded || isBusinessUpgraded) {
        const businesses = await Business.find({
          _id: { $in: newUserInfo.businesses },
        });
        const totalIncomePerHour = businesses.reduce((sum, b) => {
          const businessUpgrade = newUserInfo.businessUpgrades.find(
            (bu) => bu.businessId.toString() === b._id.toString()
          );
          const businessLevel = !!businessUpgrade ? businessUpgrade.level : 1;
          return sum + b.rewardPerHour * 2.2 ** (businessLevel - 1);
        }, 0);
        updatedInfo.totalIncomePerHour = totalIncomePerHour;
      }

      if (lastUserInfo.referrals.length !== newUserInfo.referrals.length) {
        const referralIds = newUserInfo.referrals.filter(
          (b) => !lastUserInfo.referrals.includes(b)
        );
        updatedInfo.referrals = await User.find({ _id: { $in: referralIds } });
      }

      if (
        lastUserInfo.completedTasks.length !== newUserInfo.completedTasks.length
      ) {
        const completedTaskIds = newUserInfo.completedTasks.filter(
          (b) => !lastUserInfo.completedTasks.includes(b)
        );
        updatedInfo.completedTasks = await Task.find({
          _id: { $in: completedTaskIds },
        });
      }

      if (lastUserInfo.clickPower !== newUserInfo.clickPower) {
        updatedInfo.clickPower = newUserInfo.clickPower;
      }

      if (
        lastUserInfo.lastDailyRewardTimestamp !==
        newUserInfo.lastDailyRewardTimestamp
      ) {
        updatedInfo.lastDailyRewardTimestamp =
          newUserInfo.lastDailyRewardTimestamp;
      }

      if (
        lastUserInfo.fullEnergyActivates !== newUserInfo.fullEnergyActivates
      ) {
        updatedInfo.fullEnergyActivates = newUserInfo.fullEnergyActivates;
      }

      if (
        lastUserInfo.lastFullEnergyTimestamp !==
        newUserInfo.lastFullEnergyTimestamp
      ) {
        updatedInfo.lastFullEnergyTimestamp =
          newUserInfo.lastFullEnergyTimestamp;
      }

      if (lastUserInfo.energyLevel !== newUserInfo.energyLevel) {
        updatedInfo.energyLevel = newUserInfo.energyLevel;
        updatedInfo.maxEnergy = 1000 + 500 * (newUserInfo.energyLevel - 1);
      }

      if (
        lastUserInfo.currentComboCompletions.length !==
        newUserInfo.currentComboCompletions.length
      ) {
        const competedComboIds = newUserInfo.currentComboCompletions.filter(
          (b) => !lastUserInfo.currentComboCompletions.includes(b)
        );
        updatedInfo.currentComboCompletions = await Business.find({
          _id: { $in: competedComboIds },
        });
      }

      const userLeague = await League.findOne({
        minScore: { $lte: newUserInfo.score },
        maxScore: { $gte: newUserInfo.score },
      });
      const userPlaceInLeague = await User.countDocuments({
        balance: { $lte: userLeague.maxScore, $gte: newUserInfo.score },
      });

      const deltaAddedFromBusinesses =
        newUserInfo.addedFromBusinesses - lastUserInfo.addedFromBusinesses;
      const deltaAddedEnergy =
        newUserInfo.addedEnergy - lastUserInfo.addedEnergy;

      lastUserInfo = newUserInfo;

      io.emit("liteSync", {
        ...updatedInfo,
        deltaAddedFromBusinesses: deltaAddedFromBusinesses,
        deltaAddedEnergy: deltaAddedEnergy,
        balance: newUserInfo.balance,
        score: newUserInfo.score,
        energy: newUserInfo.energy,
        userPlaceInLeague,
      });
    }, 1000);

    io.on("disconnect", () => {
      clearInterval(interval);
    });
  },
  upgradeBusiness: async (data) => {
    const parsedData = JSON.parse(data);
    const [userTgId, businessId] = parsedData;

    const user = await User.findOne({ tgId: userTgId });
    if (!user.businesses.some((b) => b.toString() == businessId.toString())) {
      console.warn(
        `User ${userTgId} tried to upgrade business ${businessId} but doesn't have it`
      );
      return;
    }

    const business = await Business.findById(businessId);
    const businessUpgrade = !!user.businessUpgrades
      ? user.businessUpgrades.find(
          (b) => b.businessId.toString() == businessId.toString()
        )
      : null;

    if (
      !!businessUpgrade &&
      businessUpgrade.timestamp + 1000 * 60 * 60 > Date.now()
    ) {
      return;
    }

    const newLevel = !!businessUpgrade ? businessUpgrade.level + 1 : 2;
    const finalPrice = Math.round(business.price * 1.2 ** newLevel);
    const otherUpgrades = user.businessUpgrades.filter(
      (b) => b.businessId.toString() != businessId.toString()
    );

    if (user.balance < finalPrice) {
      return;
    }

    const appSettings = await getAppSettings();

    const comboMatch =
      appSettings.comboBusinesses.includes(businessId) &&
      user.currentComboCompletions.length < 3 &&
      !user.currentComboCompletions.includes(businessId);
      
    console.log(
      comboMatch,
      appSettings.comboBusinesses,
      user.currentComboCompletions
    );

    const comboCompleted =
      comboMatch && user.currentComboCompletions.length == 2;

    const updateQuery = {
      $inc: {
        balance: comboCompleted
          ? appSettings.comboReward - finalPrice
          : -finalPrice,
      },
      businessUpgrades: [
        ...otherUpgrades,
        {
          businessId,
          level: newLevel,
          timestamp: newLevel >= 3 ? Date.now() : null,
        },
      ],
    };

    if (comboMatch) {
      updateQuery.currentComboCompletions = [
        ...user.currentComboCompletions,
        businessId,
      ];
    }
    if (comboCompleted) {
      io.emit("comboCompleted", { reward: appSettings.comboReward });
    }

    await User.findOneAndUpdate({ tgId: user.tgId }, updateQuery);
    io.emit("businessBought", {
      success: true,
    });
  },
  upgradeEnergy: async (userId) => {
    const user = await User.findOne({ tgId: userId });
    if (!user) {
      return;
    }

    const appSettings = await getAppSettings();
    if (!appSettings) {
      return;
    }

    if (user.energyLevel >= appSettings.maxEnergyLevel) {
      return;
    }

    const cost =
      appSettings.startEnergyUpgradeCost * 2 ** (user.energyLevel - 1);
    if (user.balance < cost) {
      return;
    }

    await User.findOneAndUpdate(
      { tgId: user.tgId },
      { $inc: { balance: -cost } }
    );
    user.energyLevel += 1;
    await user.save();
  },
});

export const handleSocketConnection = async (socket) => {
  registerEvents(socket);
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
  io.on("subscribeLiteSync", socketsLogic.subscribeLiteSync);
  io.on("upgradeBusiness", socketsLogic.upgradeBusiness);
  io.on("upgradeEnergy", socketsLogic.upgradeEnergy);
};
