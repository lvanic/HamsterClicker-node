import React, { useState, useEffect, useMemo } from "react";
import { useWebSocket } from "../../hooks/useWebsocket";
import { useUser } from "../../hooks/useUser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BoostButton } from "../../components/BoostButton";
import { RestoreSvg } from "./RestoreSvg";
import { MassTapSvg } from "./MassTapSvg";

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

  const improveClick = () => {
    if (webSocket) {
      webSocket.emit("upgradeClick", user?.tgId);
    }
  };

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

  // const dailyDisabled = useMemo(() => {
  //   if (user) {
  //     return Date.now() - user.lastDailyRewardTimestamp < 1000 * 60 * 60 * 24;
  //   } else {
  //     return true;
  //   }
  // }, [user]);
  //            onClick={() => activateBoost("dailyReward")}
  //            onClick={() => activateBoost("fullEnergyBoost")}
  //            Full Energy Boost {3 - fullEnergyActivates}/3

  return (
    <div className="font-sans p-5 rounded-lg max-w-md mx-auto">
      <ToastContainer />
      <div className="mt-4">
        <div className="flex justify-center w-full mb-8">
          <div className="w-min">
            <BoostButton />
          </div>
        </div>
        <div className="flex justify-around">
          <div
            style={{
              width: "-webkit-fill-available",
            }}
            className="flex flex-col justify-center bg-[#383838] p-4 rounded-xl mx-2"
          >
            <div className="flex justify-center h-0">
              <div
                className="w-16 h-16 relative bg-[#FD5C63] rounded-full flex justify-center items-center"
                style={{
                  top: "-50px",
                  boxShadow: "0px 0px 25.56px 0px #438EFE",
                }}
              >
                <RestoreSvg />
              </div>
            </div>
            <div className="flex justify-center mb-2 mt-5">Restore taps</div>
            <div className="flex justify-center text-xl mb-1">
              {3 - fullEnergyActivates}/3
            </div>
            <button
              disabled={energyDisabled}
              onClick={() => activateBoost("fullEnergyBoost")}
              className="p-1 rounded-lg"
              style={{
                background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
              }}
            >
              Restore
            </button>
          </div>
          <div
            style={{
              width: "-webkit-fill-available",
            }}
            className="flex flex-col justify-center bg-[#383838] p-4 rounded-xl mx-2"
          >
            <div className="flex justify-center h-0">
              <div
                className="w-16 h-16 relative bg-[#FD5C63] rounded-full flex justify-center items-center"
                style={{
                  top: "-50px",
                  boxShadow: "0px 0px 25.56px 0px #438EFE",
                }}
              >
                <MassTapSvg />
              </div>
            </div>
            <div className="flex justify-center mb-2 mt-5">Mass tap</div>
            <div className="flex justify-center text-xl mb-1">
              {user?.clickPower} lvl
            </div>
            <button
              onClick={improveClick}
              className="p-1 rounded-lg"
              style={{
                background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
              }}
            >
              Improve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
