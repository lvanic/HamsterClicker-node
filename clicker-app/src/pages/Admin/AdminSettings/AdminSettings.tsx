import React, { useState , useEffect} from "react";
import { getConfig } from "../../../utils/config";

const { adminApiUrl } = getConfig();

export const AdminSettings = () => {
  const [energyPerSecond, setEnergyPerSecond] = useState(0);
  const [rewardPerClick, setRewardPerClick] = useState(0);
  const [fullEnergyBoostPerDay, setFullEnergyBoostPerDay] = useState(0);
  const [dailyReward, setDailyReward] = useState(0);
  const [referralReward, setReferralReward] = useState(0);

  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
  }

  const handleSubmit = async () => {
    setIsError(false);
    setIsSuccess(false);

    const response = await fetch(`${adminApiUrl}/admin/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        energyPerSecond,
        rewardPerClick,
        fullEnergyBoostPerDay,
        dailyReward,
        referralReward,
      }),
    });

    if (response.ok) {
      setIsError(false);
      setIsSuccess(true);
    } else {
      setIsSuccess(false);
      setIsError(true);
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-col">
        <label className="text-xs bg-slate-300 w-2/5">Full energy boost per day</label>
        <input
          type="number"
          placeholder="Full energy boost per day"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={fullEnergyBoostPerDay}
          onChange={(e) => setFullEnergyBoostPerDay(Number(e.target.value))}
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
        <label className="text-xs bg-slate-300 w-2/5">Referral reward</label>
        <input
          type="number"
          placeholder="Referral reward"
          className="bg-slate-50 py-1 px-4 w-full outline-none"
          value={referralReward}
          onChange={(e) => setReferralReward(Number(e.target.value))}
        />
      </div>

      <button className="bg-green-600 hover:bg-green-700 text-white font-light py-1 px-4 w-full font-mono" onClick={handleSubmit}>
        CONFIRM
      </button>

      {isSuccess && <div className="bg-green-400 text-center text-white">Settings saved</div>}
      {isError && <div className="bg-red-600 text-center text-white">Error</div>}
    </div>
  );
};