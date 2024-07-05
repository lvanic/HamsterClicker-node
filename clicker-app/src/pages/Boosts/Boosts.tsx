import React, { useState, useEffect, useMemo } from "react";
import { useWebSocket } from "../../hooks/useWebsocket";
import { useUser } from "../../hooks/useUser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Boosts = () => {
  const { webSocket } = useWebSocket();
  const { user } = useUser();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState("");

  useEffect(() => {
    if (webSocket) {
      const handleBoostActivated = (message: string) => {
        toast.success(message);
      };

      webSocket.on("boostActivated", handleBoostActivated);

      return () => {
        webSocket.off("boostActivated", handleBoostActivated);
      };
    }
  }, [webSocket]);

  const activateBoost = (boostName: string) => {
    if (webSocket) {
      webSocket.emit("activateBoost", JSON.stringify([user?.tgId, boostName]));
    }
  };

  const dailyDisabled = useMemo(() => {
    if (user) {
      return Date.now() - user.lastDailyRewardTimestamp < 1000 * 60 * 60 * 24;
    } else {
      return true;
    }
  }, [user]);

  const energyDisabled = useMemo(() => {
    if (user) {
      return (
        Date.now() - user?.lastFullEnergyTimestamp < 1000 * 60 * 60 * 24 &&
        user?.fullEnergyActivates >= 3
      );
    } else {
      return true;
    }
  }, [user]);

  const fullEnergyActivates = useMemo(() => {
    if (user) {
      if (Date.now() - user?.lastFullEnergyTimestamp > 1000 * 60 * 60 * 24) {
        return 0;
      }
    }
    return user?.fullEnergyActivates || 0;
  }, [user]);

  return (
    <div className="font-sans p-5 rounded-lg max-w-md mx-auto shadow-md">
      <ToastContainer />
      <ul className="list-none p-0">
        <li className="mb-4">
          <button
            onClick={() => activateBoost("dailyReward")}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-75 disabled:bg-green-900"
            disabled={dailyDisabled}
          >
            Daily Reward
          </button>
        </li>
        <li className="mb-4">
          <button
            onClick={() => activateBoost("fullEnergyBoost")}
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-75 disabled:bg-green-900"
            disabled={energyDisabled}
          >
            Full Energy Boost {3 - fullEnergyActivates}/3
          </button>
        </li>
      </ul>
    </div>
  );
};
