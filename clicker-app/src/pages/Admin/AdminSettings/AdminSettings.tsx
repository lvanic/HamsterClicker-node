import React, { useState, useEffect } from "react";
import { getConfig } from "../../../utils/config";

const { adminApiUrl } = getConfig();

export const AdminSettings = () => {
  const [energyPerSecond, setEnergyPerSecond] = useState(0);
  const [rewardPerClick, setRewardPerClick] = useState(0);
  const [fullEnergyBoostPerDay, setFullEnergyBoostPerDay] = useState(0);
  const [dailyReward, setDailyReward] = useState(0);
  const [referralReward, setReferralReward] = useState(0);
  const [maxClickLevel, setMaxClickLevel] = useState(0);
  const [startClickUpgradeCost, setStartClickUpgradeCost] = useState(0);
  const [maxEnergyLevel, setMaxEnergyLevel] = useState(0);
  const [startEnergyUpgradeCost, setStartEnergyUpgradeCost] = useState(0);
  const [comboReward, setComboReward] = useState(0);
  const [comboUpdateDayHour, setComboUpdateDayHour] = useState(0);
  const [comboBusinesses, setComboBusinesses] = useState([]);
  const [premiumReferralReward, setPremiumReward] = useState(0);

  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const response = await fetch(`${adminApiUrl}/admin/settings`, {
      headers: {
        "Admin-Token": localStorage.getItem("password") || "",
      },
    });
    const settings = await response.json();
    setEnergyPerSecond(settings.energyPerSecond);
    setRewardPerClick(settings.rewardPerClick);
    setFullEnergyBoostPerDay(settings.fullEnergyBoostPerDay);
    setDailyReward(settings.dailyReward);
    setReferralReward(settings.referralReward);
    setMaxClickLevel(settings.maxClickLevel);
    setStartClickUpgradeCost(settings.startClickUpgradeCost);
    setMaxEnergyLevel(settings.maxEnergyLevel);
    setStartEnergyUpgradeCost(settings.startEnergyUpgradeCost);
    setComboReward(settings.comboReward);
    setComboUpdateDayHour(settings.comboUpdateDayHour);
    setComboBusinesses(settings.comboBusinesses);
    setPremiumReward(settings.premiumReferralReward);
  };

  const handleSubmit = async () => {
    setIsError(false);
    setIsSuccess(false);

    const response = await fetch(`${adminApiUrl}/admin/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Admin-Token": localStorage.getItem("password") || "",
      },
      body: JSON.stringify({
        energyPerSecond,
        rewardPerClick,
        fullEnergyBoostPerDay,
        dailyReward,
        referralReward,
        maxClickLevel,
        startClickUpgradeCost,
        maxEnergyLevel,
        startEnergyUpgradeCost,
        comboReward,
        comboUpdateDayHour,
        premiumReferralReward,
      }),
    });

    if (response.ok) {
      setIsError(false);
      setIsSuccess(true);
    } else {
      setIsSuccess(false);
      setIsError(true);
    }
  };

  return (
    <div className="flex flex-col space-y-2 text-black">
      <div className="flex flex-col mb-4">
        <h2 className="text-white">Current combos:</h2>

        <div className="flex space-x-2">
          {comboBusinesses?.map((business: any) => (
            <div className="bg-slate-50 px-2 py-1 rounded-md flex justify-center items-center">
              <img src={business.avatarUrl} className="w-6 h-6" />
              <div className="text-xs ml-2">{business.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">Max click level</label>
        <input
          type="number"
          placeholder="Max click level"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={maxClickLevel}
          onChange={(e) => setMaxClickLevel(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">
          Start click upgrade cost
        </label>
        <input
          type="number"
          placeholder="Start click upgrade cost"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={startClickUpgradeCost}
          onChange={(e) => setStartClickUpgradeCost(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">
          Premium referral reward
        </label>
        <input
          type="number"
          placeholder="Premium referral reward"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={premiumReferralReward}
          onChange={(e) => setPremiumReward(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">Referral reward</label>
        <input
          type="number"
          placeholder="Referral reward"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={referralReward}
          onChange={(e) => setReferralReward(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">Daily reward</label>
        <input
          type="number"
          placeholder="Daily reward"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={dailyReward}
          onChange={(e) => setDailyReward(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">Max energy level</label>
        <input
          type="number"
          placeholder="Max energy level"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={maxEnergyLevel}
          onChange={(e) => setMaxEnergyLevel(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">
          Start energy upgrade cost
        </label>
        <input
          type="number"
          placeholder="Start energy upgrade cost"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={startEnergyUpgradeCost}
          onChange={(e) => setStartEnergyUpgradeCost(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">Combo reward</label>
        <input
          type="number"
          placeholder="Combo reward"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={comboReward}
          onChange={(e) => setComboReward(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">
          Combo update day hour
        </label>
        <input
          type="number"
          placeholder="Combo update day hour"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={comboUpdateDayHour}
          onChange={(e) => setComboUpdateDayHour(Number(e.target.value))}
        />
      </div>

      <button
        className="bg-green-600 hover:bg-green-700 text-white font-light py-1 px-4 w-full font-mono"
        onClick={handleSubmit}
      >
        CONFIRM
      </button>

      {isSuccess && (
        <div className="bg-green-400 text-center text-white">
          Settings saved
        </div>
      )}
      {isError && (
        <div className="bg-red-600 text-center text-white">Error</div>
      )}
    </div>
  );
};
