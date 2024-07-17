import { Click, User, Task, League, Business } from "./models.js";
import { getAppSettings } from "./admin.js";

export const initSocketsLogic = (io) => ({
  clickEvent: async (data) => {
    const parsedData = JSON.parse(data);
    const tgUserId = parsedData["user_id"];
    const position = { x: parsedData.position.x, y: parsedData.position.y };
    const timestamp = parsedData["time_stamp"];

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
          $inc: { balance: user.clickPower, energy: -1 },
        }
      );
      await user.save();
    } catch (e) {
      console.error(e);
    }

    const click = new Click({
      user: { tgId: tgUserId },
      position,
      timestamp,
    });
    await click.save();
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
            $inc: { balance: task.rewardAmount },
          }
        );

        await user.save();
        io.emit("taskStatus", { id: task.id, finished: true });
        io.emit("user", user);
      } else {
        io.emit("taskStatus", { id: task.id, finished: false });
      }
    } else if (task.type == "twitter") {
      // const Twit = require("twit");
      // const T = new Twit({
      //   consumer_key: "your-consumer-key",
      //   consumer_secret: "your-consumer-secret",
      //   access_token: "your-access-token",
      //   access_token_secret: "your-access-token-secret",
      //   timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
      // });
      // const checkIfUserFollows = async (sourceUser, targetUser) => {
      //   try {
      //     const result = await T.get("friendships/show", {
      //       source_screen_name: sourceUser,
      //       target_screen_name: targetUser,
      //     });
      //     const following = result.data.relationship.source.following;
      //     return following;
      //   } catch (error) {
      //     console.error("Error checking friendship:", error);
      //     throw error;
      //   }
      // };
      // const sourceUser = "sourceUserName";
      // const targetUser = "targetUserName";
      // checkIfUserFollows(sourceUser, targetUser)
      //   .then((isFollowing) => {
      //     if (isFollowing) {
      //       console.log(`${sourceUser} is following ${targetUser}`);
      //     } else {
      //       console.log(`${sourceUser} is not following ${targetUser}`);
      //     }
      //   })
      //   .catch((error) => {
      //     console.error("Error:", error);
      //   });
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
      io.emit("user", user);
    }
  },
  getUser: async (userId) => {
    const tgUserId = Number(userId);
    const user = await User.findOne({ tgId: tgUserId })
      .populate("referrals")
      .populate("businesses");
    const appSettings = await getAppSettings();

    if (!user) {
      return;
    }

    const userLeague = await League.findOne({
      minBalance: { $lte: user.balance },
      maxBalance: { $gte: user.balance },
    });

    const userPlaceInLeague = await User.countDocuments({
      balance: { $lte: userLeague.maxBalance, $gte: user.balance },
    });

    const totalIncomePerHour = user.businesses.reduce((sum, b) => {
      return sum + b.rewardPerHour;
    }, 0);

    const userData = {
      id: user._id,
      ...user.toObject(),
      referrals: user.referrals.map((r) => ({ id: r._id, ...r })),
      businesses: user.businesses.map((b) => ({ id: b._id, ...b })),
      userPlaceInLeague: userPlaceInLeague + 1,
      totalIncomePerHour,
      league: { id: userLeague._id, ...userLeague.toObject() },
    };

    io.emit("user", userData);
  },
  getLeagueInfo: async (leagueId, topUsersCount) => {
    const league = await League.findOne({ _id: leagueId });

    const usersInLeague = await User.countDocuments({
      balance: { $lte: league.maxBalance, $gte: league.minBalance },
    });

    const topUsersInLeague = await User.find({
      balance: { $lte: league.maxBalance, $gte: league.minBalance },
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

    const availableBusinesses = businesses.filter(
      (b) =>
        !user.businesses.some(
          (userBusinessId) => userBusinessId.toString() == b._id.toString()
        )
    );

    io.emit("businesses", availableBusinesses);
  },
  buyBusiness: async (data) => {
    const parsedData = JSON.parse(data);
    const [userTgId, businessId] = parsedData;

    console.log(userTgId, businessId);
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

    user.balance -= business.price;
    user.businesses.push(business._id);
    await user.save();
    const newBusiness = { id: business.id, ...business };
    io.emit("businessBought", { success: true, newBusiness });
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
        user.energy = 1000;
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

    io.emit("user", user);
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

    await User.findOneAndUpdate({ tgId: user.tgId }, { $inc: { balance: -cost } });
    user.clickPower += 1;
    await user.save();

    io.emit("user", user.toObject());
  }
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
};
