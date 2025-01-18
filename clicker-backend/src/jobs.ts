import { getAppSettings } from "./admin.js";
import { Business, User } from "./models.js";

const ENERGY_UPDATE_INTERVAL_IN_SECOND = 1;
const COMBO_UPDATE_IN_SECOND = 60 * 60;

export const runEnergyRecover = () => {
  setInterval(async () => {
    // try {
    //   const users = await User.find({
    //     $expr: {
    //       $lt: [
    //         "$energy",
    //         {
    //           $add: [
    //             1000,
    //             { $multiply: [500, { $subtract: ["$energyLevel", 1] }] },
    //           ],
    //         },
    //       ],
    //     },
    //   });
    //   await Promise.all(
    //     users.map((user) => {
    //       return User.findOneAndUpdate(
    //         { tgId: user.tgId },
    //         {
    //           $inc: { energy: 1, addedEnergy: 1 },
    //         }
    //       );
    //     })
    //   );
    // } catch {}
    // console.log("Energy recovered for users:", users.map((user) => `${user.tgId}: ${user.energy}`).join('\n'));
  }, ENERGY_UPDATE_INTERVAL_IN_SECOND * 1000);
};

export const runBusinesses = () => {
  //   setInterval(async () => {
  //     try {
  //       const businesses = await Business.find({});
  //       const users = await User.find({
  //         "businesses.0": { $exists: true },
  //         lastOnlineTimestamp: { $gt: Date.now() - 1000 * 60 * 60 * 3 },
  //       }).exec();
  //       // console.log("Updating businesses... Found users with businesses: ", users.length);
  //       const updatePromises = users.map((user) => {
  //         const totalReward = user.businesses.reduce((sum, bId) => {
  //           const business = businesses.find(
  //             (b) => b._id.toString() === bId.toString()
  //           );
  //           if (!business) {
  //             console.error(
  //               "[FATAL]: Detected user with business that doesn't exist."
  //             );
  //             return sum;
  //           }
  //           const businessUpgrade = user.businessUpgrades.find(
  //             (bu) => bu.businessId.toString() === business._id.toString()
  //           );
  //           const businessLevel = !!businessUpgrade ? businessUpgrade.level : 1;
  //           const levelAdjustedReward =
  //             business.rewardPerHour * 2.2 ** (businessLevel - 1);
  //           const normalizedReward =
  //             (levelAdjustedReward * BUSINESS_UPDATE_IN_SECOND) / 3600;
  //           return sum + normalizedReward;
  //         }, 0);
  //         return User.findOneAndUpdate(
  //           { _id: user._id },
  //           {
  //             $inc: {
  //               balance: totalReward,
  //               score: totalReward,
  //               addedFromBusinesses: totalReward,
  //             },
  //           }
  //         );
  //       });
  //       await Promise.all(updatePromises);
  //     } catch {
  //       console.log("error run businesses");
  //     }
  //   }, BUSINESS_UPDATE_IN_SECOND * 1000);
};

const updateCombos = async () => {
  try {
    const appSettings = await getAppSettings();

    const currentHours = new Date().getHours();
    if (
      appSettings.comboBusinesses.length !== 0 &&
      appSettings.lastComboUpdateTimestamp + 1000 * 60 * 60 * 24 >
        new Date().getTime() &&
      currentHours >= appSettings.comboUpdateDayHour
    ) {
      return;
    }

    const businesses = await Business.find({ isDeleted: false });

    if (businesses.length < 3) {
      return;
    }
    const randomIndexes: number[] = [];

    while (true) {
      const randomIndex = Math.floor(Math.random() * businesses.length);
      if (!randomIndexes.includes(randomIndex)) {
        randomIndexes.push(randomIndex);
      } else {
        continue;
      }
      console.info("Updating combos...", new Date().getDate());

      if (randomIndexes.length === 3) {
        break;
      }
    }

    appSettings.comboBusinesses = [
      businesses[randomIndexes[0]]._id,
      businesses[randomIndexes[1]]._id,
      businesses[randomIndexes[2]]._id,
    ];
    appSettings.lastComboUpdateTimestamp = Date.now();
    await appSettings.save();
    await User.updateMany({}, { $set: { currentComboCompletions: [] } });
  } catch {
    console.log("error update combo");
  }
};

export const runCombos = () => {
  updateCombos();
  setInterval(updateCombos, COMBO_UPDATE_IN_SECOND * 1000);
};
