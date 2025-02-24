import { CronJob } from "cron";

import { appDataSource } from "./core/database";
import { User } from "./models/user";

const REWARD_PERCENTAGE = 0.1;

export const restoreFullEnergyBoostJob = CronJob.from({
  cronTime: "00 00 00 * * *",
  onTick: async function () {
    try {
      const userRepository = appDataSource.getRepository(User);

      await userRepository.update(
        {},
        {
          fullEnergyActivates: 0,
        },
      );
    } catch (error) {
      console.error("Restoring energy boosts completed with an error", error);
    }
  },
  start: false,
  timeZone: "utc",
});

export const rewardReferralsJob = CronJob.from({
  cronTime: "00 00 00 * * *",
  onTick: async function () {
    try {
      const userRepository = appDataSource.getRepository(User);

      const users = await userRepository.find({ relations: ["referrals"] });

      for (const user of users) {
        let totalReferralEarnings = 0;

        for (const referral of user.referrals) {
          totalReferralEarnings += referral.scoreLastDay;
        }

        const reward = totalReferralEarnings * REWARD_PERCENTAGE;
        user.balance += reward;

        for (const referral of user.referrals) {
          referral.scoreLastDay = 0;
        }

        await userRepository.save([user, ...user.referrals]);
      }

      console.log("Reward referrals job completed successfully.");
    } catch (error) {
      console.error("Reward referrals job completed with an error", error);
    }
  },
  start: false,
  timeZone: "utc",
});
