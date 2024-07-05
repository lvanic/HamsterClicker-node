import { useEffect, useState } from "react";
import { getConfig } from "../utils/config";

const { adminApiUrl } = getConfig();

export const useSettings = () => {
  const [energyPerSecond, setEnergyPerSecond] = useState(0);
  const [rewardPerClick, setRewardPerClick] = useState(0);
  const [fullEnergyBoostPerDay, setFullEnergyBoostPerDay] = useState(0);
  const [dailyReward, setDailyReward] = useState(0);
  const [referralReward, setReferralReward] = useState(0);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const response = await fetch(`${adminApiUrl}/admin/settings`);
    const settings = await response.json();
    setEnergyPerSecond(settings.energyPerSecond);
    setRewardPerClick(settings.rewardPerClick);
    setFullEnergyBoostPerDay(settings.fullEnergyBoostPerDay);
    setDailyReward(settings.dailyReward);
    setReferralReward(settings.referralReward);
  };

  return {
    energyPerSecond,
    referralReward,
    fullEnergyBoostPerDay,
    dailyReward,
    rewardPerClick,
  };
};