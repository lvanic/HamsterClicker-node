import React, { useState, useEffect, useMemo, useContext } from "react";
import { useWebSocket } from "../../hooks/useWebsocket";
import { useUser } from "../../hooks/useUser";
import { BoostModal } from "./BoostModal";
import { useSettings } from "../../hooks/useSettings";
import { NotifyContext, NotifyMessage } from "../../contexts/NotifyContext";
import { getLocalization } from "../../localization/getLocalization";
import { User } from "../../models";

export const Boosts = () => {
  const { webSocket } = useWebSocket();
  const { user, setUser } = useUser();
  const {
    maxClickLevel,
    maxEnergyLevel,
    startClickUpgradeCost,
    startEnergyUpgradeCost,
  } = useSettings();
  const notifyContext = useContext(NotifyContext);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<any>(null);
  const [isEnergyUpgrading, setEnergyUpgrading] = useState(false);
  const [isClickUpgrading, setClickUpgrading] = useState(false);
  const [isEnergyRestoring, setEnergyRestoring] = useState(false);
  const selectedLanguage = localStorage.getItem("language") || "en";

  const settings = useSettings();

  useEffect(() => {
    if (webSocket) {
      webSocket.on("boostActivated", ({ success, message }) => {
        setEnergyRestoring(false);
        notifyContext?.setNotify({ status: "ok", message });
      });

      webSocket.on("clickPowerUpgraded", ({ success }) => {
        setClickUpgrading(false);
        notifyContext?.setNotify({
          status: success ? "ok" : "error",
          message: success
            ? getLocalization("clickPowerImproved")
            : getLocalization("clickPowerNotImproved"),
        });
      });

      webSocket.on("energyUpgraded", ({ success }) => {
        setEnergyUpgrading(false);
        notifyContext?.setNotify({
          status: success ? "ok" : "error",
          message: success
            ? getLocalization("energyPowerImproved")
            : getLocalization("energyPowerNotImproved"),
        });
      });

      return () => {
        webSocket.off("boostActivated");
        webSocket.off("clickPowerUpgraded");
        webSocket.off("energyUpgraded");
      };
    }
  }, [webSocket]);

  const activateFullEnergyBoost = () => {
    if (
      webSocket &&
      (user?.fullEnergyActivates || 0) < settings.fullEnergyBoostPerDay
    ) {
      setEnergyRestoring(true);
      webSocket.emit(
        "activateBoost",
        JSON.stringify([user?.tgId, "fullEnergyBoost", selectedLanguage])
      );

      setUser &&
        setUser((prev: User | null) => {
          if (!prev) {
            return prev;
          }
          // alert(prev?.fullEnergyActivates)
          return {
            ...prev,
            fullEnergyActivates: (prev?.fullEnergyActivates || 0) + 1,
            lastFullEnergyTimestamp: Date.now(),
          };
        });
    }
  };

  const improveClick = () => {
    if (user?.clickPower && user?.clickPower >= maxClickLevel) {
      notifyContext?.setNotify({
        status: "unknown",
        message: getLocalization("maxClickerLevel"),
      });
      return;
    }
    if (
      webSocket &&
      startClickUpgradeCost * 2 ** ((user?.clickPower || 2) - 1) <=
        (user?.balance || 0)
    ) {
      setClickUpgrading(true);
      webSocket.emit("upgradeClick", user?.tgId);
    } else {
      notifyContext?.setNotify({
        status: "error",
        message: getLocalization("notEnoughBalance"),
      });
    }
  };

  const upgradeEnergy = () => {
    if ((user?.energyLevel || 0) >= maxEnergyLevel) {
      notifyContext?.setNotify({
        status: "unknown",
        message: getLocalization("maxEnergyLevel"),
      });
      return;
    }
    if (
      webSocket &&
      startEnergyUpgradeCost * 2 ** ((user?.energyLevel || 2) - 1) <=
        (user?.balance || 0)
    ) {
      setEnergyUpgrading(true);
      webSocket.emit("upgradeEnergy", user?.tgId);

      setUser &&
        setUser((prev: User | null) => {
          if (!prev) {
            return prev;
          }
          // alert(prev?.fullEnergyActivates)
          return {
            ...prev,
            maxEnergy: (user?.maxEnergy || 1000) + 500,
          };
        });
    } else {
      notifyContext?.setNotify({
        status: "error",
        message: getLocalization("notEnoughBalance"),
      });
    }
  };

  const energyDisabled = useMemo(() => {
    if (user) {
      return (
        Date.now() - user?.lastFullEnergyTimestamp < 1000 * 60 * 60 * 24 &&
        user?.fullEnergyActivates >= settings.fullEnergyBoostPerDay
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
  }, [user?.fullEnergyActivates]);

  const boosts = [
    {
      id: 1,
      Icon: <img src="/img/multitap.png" className="w-8" />,
      title: getLocalization("massTap"),
      description: getLocalization("massTapDesc"),
      action: improveClick,
      buttonLabel: getLocalization("improve"),
      level: user?.clickPower,
    },
    {
      id: 2,
      Icon: <img src="/img/energy-limit.png" className="w-8" />,
      title: getLocalization("upgradeEnergy"),
      description: getLocalization("upgradeEnergyDesc"),
      action: upgradeEnergy,
      buttonLabel: getLocalization("upgrade"),
      level: user?.energyLevel,
    },
  ];

  // alert(`${settings.fullEnergyBoostPerDay} - ${fullEnergyActivates}`);
  
  const remainingBoosts =
    settings.fullEnergyBoostPerDay - fullEnergyActivates < 0
      ? 0
      : settings.fullEnergyBoostPerDay - fullEnergyActivates;

  return (
    <div className="px-3 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <img src="/img/boost.png" />
        <div>
          <div className="uppercase text-lg">Your daily Boosters</div>
          <div
            onClick={activateFullEnergyBoost}
            className="pl-3 py-2 pr-0 my-1 rounded-md flex items-center shadow-sm w-full relative overflow-hidden gap-2"
            style={{
              background: "linear-gradient(57.26deg, #761B3F 0%, #78490D 100%)",
            }}
          >
            <img
              className="absolute w-full h-full left-0 top-0"
              src="/img/friend-mask.png"
            />
            <img src="/img/lightning.png" className="w-8" />
            <div className="w-full">
              <div>Full Refilment Energy</div>
              <div className="flex w-full">
                <div className="text-[#F7B84B] w-1/4">
                  {remainingBoosts}/{settings.fullEnergyBoostPerDay}
                </div>
                <div className="flex gap-2 items-center w-full justify-between pr-4">
                  {[...Array(remainingBoosts)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full bg-[#F7B84B] h-2 w-full"
                    />
                  ))}

                  {[...Array(fullEnergyActivates)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full bg-[#00000080] h-2 w-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="uppercase text-lg">Boosts</div>
          {boosts.map((boost) => (
            <div
              key={boost.id}
              onClick={() => {
                setSelectedBoost(boost);
                setModalOpen(true);
              }}
              className="pl-3 py-2 pr-0 my-1 rounded-md flex items-center shadow-sm w-full relative overflow-hidden gap-2"
              style={{
                background:
                  "linear-gradient(57.26deg, #761B3F 0%, #78490D 100%)",
              }}
            >
              <img
                className="absolute w-full h-full left-0 top-0"
                src="/img/friend-mask.png"
              />
              {boost.Icon}
              <div className="w-full">
                <div>{boost.title}</div>
                <div className="flex items-center gap-2">
                  <div className="text-[#F7B84B]">
                    {boost.title == "Mass tap" ? "+1" : "+500"}
                  </div>
                  <div className="font-light">|</div>
                  <div className="text-md font-light">level {boost.level}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {isModalOpen && selectedBoost && (
        <BoostModal
          Icon={selectedBoost.Icon}
          title={selectedBoost.title}
          description={selectedBoost.description}
          onClose={() => setModalOpen(false)}
          onPurchase={selectedBoost.action}
          eggIcon={false}
          purchaseText={selectedBoost.buttonLabel}
        />
      )}
    </div>
  );
};
