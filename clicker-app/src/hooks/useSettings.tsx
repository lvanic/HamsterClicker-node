import { useContext, useEffect, useState } from "react";
import { DataContext } from "../contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { Settings } from "../models";

export const useSettings = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("DataContext required");
  }
  if (!context.settings) {
    const fictSettings: Settings = {
      startClickUpgradeCost: 1000,
      startEnergyUpgradeCost: 1000,
      energyPerSecond: 1,
      fullEnergyBoostPerDay: 3,
      dailyReward: 300,
      referralReward: 500,
      maxClickLevel: 10,
      rewardPerClick: 1,
      maxEnergyLevel: 10,
      comboReward: 1000,
      comboUpdateDayHour: 0,
      premiumReferralReward: 500,
      isRewardForReferalActive: false,
      referralTaskEndsAt: 0,
      newRefferalsToActivate: 3,
    };
    return { ...fictSettings };
  }

  return { ...context.settings };
};
