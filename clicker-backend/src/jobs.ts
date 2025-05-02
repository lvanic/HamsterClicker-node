import { CronJob } from "cron";

import { appDataSource } from "./core/database";
import logger from "./core/logger";
import { User } from "./models/user";

// TODO: move this variable to appSettings
const REWARD_PERCENTAGE = 0.1;

export const restoreFullEnergyBoostJob = CronJob.from({
  cronTime: "00 00 01 * * *",
  onTick: async function () {
    try {
      logger.info("RestoreFullEnergyBoost job started");

      const userRepository = appDataSource.getRepository(User);

      await userRepository.update(
        {},
        {
          fullEnergyActivates: 0,
        },
      );

      logger.info("RestoreFullEnergyBoost job completed successfully");
    } catch (error) {
      logger.error("RestoreFullEnergyBoost job completed with an error", error);
    }
  },
  start: false,
  timeZone: "utc",
});

// TODO: optimize, can cause problems with a large number of users
export const rewardReferralsJob = CronJob.from({
  cronTime: "00 00 00 * * *",
  onTick: async function () {
    try {
      logger.info("RewardReferrals job started");

      const userRepository = appDataSource.getRepository(User);

      const users = await userRepository.find({ relations: ["referrals"] });

      for (const user of users) {
        let totalReferralEarnings = 0;

        for (const referral of user.referrals) {
          totalReferralEarnings += referral.scoreLastDay;
        }

        const reward = Math.floor(totalReferralEarnings * REWARD_PERCENTAGE);

        // TODO: resource intensive log, should be removed
        logger.debug("The user a reward from referrals", {
          tgId: user.tgId,
          referrals: user.referrals.map((referral) => {
            return {
              scoreLastDay: referral.scoreLastDay,
              tgId: referral.tgId,
            };
          }),
          totalReferralEarnings,
        });
        user.balance += reward;
        user.score += reward;

        for (const referral of user.referrals) {
          referral.scoreLastDay = 0;
        }

        await userRepository.save([user, ...user.referrals]);
      }

      logger.info("RewardReferrals job completed successfully.");
    } catch (error) {
      logger.error("RewardReferrals job completed with an error", error);
    }
  },
  start: false,
  timeZone: "utc",
});
