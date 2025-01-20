import { Socket } from "socket.io";
import { appDataSource } from "../core/database";
import { Business } from "../models/business";
import { User } from "../models/user";
import { getAppSettingsWithBusinesses } from "./appSettingsService";
import { findFullUserInfoByTgId, updateUserByTgId } from "./userService";

export const buyBusiness = async (
  tgId: number,
  businessId: number,
  io: Socket,
  buffer: Record<string, number>,
): Promise<void> => {
  try {
    const queryRunner = await appDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    const user = await queryRunner.manager.findOneByOrFail(User, { tgId });
    const business = await queryRunner.manager.findOneByOrFail(Business, { id: businessId });

    if (!user || business.refsToUnlock > user.businesses.length || business.price > user.balance + (buffer[tgId] || 0)) {
      console.log("Недостаточно средств или бизнес заблокирован");
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      io.emit("businessBought", { success: false, id: businessId });
      return;
    }

    const appSettings = await getAppSettingsWithBusinesses();

    const comboMatch =
      appSettings.comboBusinesses.some((c) => c.id == businessId) &&
      user.currentComboCompletions.length < 3 &&
      !user.currentComboCompletions.find(business => business.id === businessId);
    const comboCompleted = comboMatch && user.currentComboCompletions.length == 2;

    user.balance -= business.price;
    user.businesses.push(business);

    if (comboMatch) {
      user.currentComboCompletions.push(business);
    }

    if (comboCompleted) {
      user.balance += appSettings.comboReward;
      io.emit("comboCompleted", { reward: appSettings.comboReward });
    }

    await updateUserByTgId(tgId, user);

    await queryRunner.commitTransaction();
    await queryRunner.release();

    const updatedUser = await findFullUserInfoByTgId(tgId);

    const businesses = await updatedUser.businesses;

    // TODO: fix this
    // const totalIncomePerHour = businesses.reduce((sum: number, b) => {
    //   const businessUpgrade = updatedUser.businessUpgrades.find(
    //     (bu: { businessId: string }) => bu.businessId.toString() === b._id.toString(),
    //   );
    //   const businessLevel = businessUpgrade ? businessUpgrade.level : 1;
    //   return sum + b.rewardPerHour * 1.2 ** businessLevel;
    // }, 0);

    // const currentComboBusinesses = businesses.filter((b: { _id: string }) =>
    //   user.currentComboCompletions.includes(b._id.toString()),
    // );

    io.emit("liteSync", {
      balance: updatedUser.balance,
      score: updatedUser.score,
      energy: updatedUser.energy,
      newBusinesses: businesses,
      // FIXME
      // totalIncomePerHour: totalIncomePerHour,
      // currentComboCompletions: comboMatch ? currentComboBusinesses : null,
      totalIncomePerHour: 0, // temp value
      currentComboCompletions: null, // temp value
    });

    io.emit("businessBought", { success: true, id: businessId });
  } catch (error) {
    console.error(
      "Ошибка при покупке бизнеса после нескольких попыток:",
      error
    );
    // TODO: query runner should be released
    io.emit("businessBought", { success: false, id: businessId });
  }
};
