import { AppSettings } from "../models/appSettings";

// TODO: probably this settings should be in app settings
export const USER_MAX_ENERGY = 1000;
export const OFFLINE_REWARD_BASE = 100;

export const DEFAULT_APP_SETTINGS: Omit<AppSettings, "id"> = {
  energyPerSecond: 1,
  rewardPerClick: 1,
  fullEnergyBoostPerDay: 1,
  dailyReward: 1,
  referralReward: 1,
  maxClickLevel: 1,
  startClickUpgradeCost: 1,
  premiumReferralReward: 1,
  maxEnergyLevel: 1,
  startEnergyUpgradeCost: 1,
  comboReward: 1,
  comboUpdateDayHour: 0,
  lastComboUpdateTimestamp: 0,
  comboBusinesses: [],
  isRewardForReferalActive: false,
  referralTaskEndsAt: 0,
  newRefferalsToActivate: 3,
};
