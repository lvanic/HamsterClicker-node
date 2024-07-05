import { Click, User, Task } from "./models.js";
import { getAppSettings } from "./admin.js";

export const handleSocketConnection = async (socket) => {
  registerEvents(socket);
};

export const registerEvents = (io) => {
  io.on("clickEvent", async (data) => {
    const parsedData = JSON.parse(data);
    // console.log("clickEvent: ", parsedData["time_stamp"]);
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
          $inc: { balance: 1, energy: -1 },
        }
      );
      await user.save();
    } catch(e) {
      console.error(e);
    }

    const click = new Click({
      user: { tgId: tgUserId },
      position,
      timestamp,
    });
    await click.save();
  });

  io.on("checkTaskStatus", async (data) => {
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

    if (user.completedTasks.includes((ut) => ut.id == task.id)) {
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
      //if (task.type == "link")
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
  });

  io.on("getUser", async (userId) => {
    const tgUserId = Number(userId);
    const user = await User.findOne({ tgId: tgUserId }).populate("referrals");

    if (!user) {
      return;
    }

    const userData = {
      tgId: user.tgId,
      avatarUrl: user.avatarUrl,
      tgUsername: user.tgUsername,
      balance: user.balance,
      energy: user.energy,
      lastOnlineTimestamp: user.lastOnlineTimestamp,
      connectedWallet: user.connectedWallet,
      lastDailyRewardTimestamp: user.lastDailyRewardTimestamp,
      lastFullEnergyTimestamp: user.lastFullEnergyTimestamp,
      fullEnergyActivates: user.fullEnergyActivates,
      referrals: user.referrals,
      completedTasks: user.completedTasks,
    };

    io.emit("user", userData);
  });

  io.on("getTasks", async () => {
    const tasks = await Task.find({ active: true});
    io.emit("tasks", tasks);
  });

  io.on("activateBoost", async (data) => {
    const parsedData = JSON.parse(data);
    const [tgUserId, boostName] = parsedData;

    const dayMs = 1000 * 60 * 60 * 24;
    const appSettings = await getAppSettings();
    const user = await User.findOne({ tgId: tgUserId });
    if (!user) {
      return;
    }
    console.log(user);

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
        io.emit("boostActivated", `You received a daily reward of ${appSettings.dailyReward} coins`);
      }
    }

    await user.save();

    io.emit("user", user);
  });
};
