import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";
import { useWebSocket } from "../../hooks/useWebsocket";
import { useUser } from "../../hooks/useUser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BoostButton } from "../../components/BoostButton";
import { RestoreSvg } from "./RestoreSvg";
import { MassTapSvg } from "./MassTapSvg";
import { BoostModal } from "./BoostModal";
import { useSettings } from "../../hooks/useSettings";
import { NotifyContext, NotifyMessage } from "../../contexts/NotifyContext";

type Boost = {
  id: number;
  Icon: any;
  title: string;
  description: string;
  additionalInfo?: (level: number) => string;
  eggIcon: boolean;
  purchaseText: (nextCost: number) => string;
};

const boosts: Boost[] = [
  {
    id: 0,
    Icon: RestoreSvg,
    title: "Restore taps",
    additionalInfo: (level: number) => ``,
    description: "Restore your taps and continue mining!",
    eggIcon: false,
    purchaseText: (nextCost: number) => "Get it for free",
  },
  {
    id: 1,
    Icon: MassTapSvg,
    title: "Mass tap",
    description: "Increases the amount of currency per click",
    additionalInfo: (level: number) => `Adds +1 tap for ${level} lvl`,
    eggIcon: true,
    purchaseText: (nextCost: number) => `Upgrade for ${nextCost} coins`,
  },
  {
    id: 2,
    Icon: RestoreSvg,
    title: "Upgrade energy",
    description: "Increases the amount of energy available to the user",
    additionalInfo: (level: number) => `Adds 500 energy for ${level} lvl`,
    eggIcon: true,
    purchaseText: (nextCost: number) => `Upgrade for ${nextCost} coins`,
  },
];

export const Boosts = () => {
  const { webSocket } = useWebSocket();
  const { user } = useUser();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<Boost | null>(null);
  const { startClickUpgradeCost, startEnergyUpgradeCost } = useSettings();
  const notifyContext = useContext(NotifyContext);

  useEffect(() => {
    if (webSocket) {
      const handleBoostActivated = (message: string) => {
        const notify: NotifyMessage = {
          status: "ok",
          className: "h-72",
          message: message,
        };

        notifyContext?.setNotify(notify);
      };

      webSocket.on("boostActivated", handleBoostActivated);

      return () => {
        webSocket.off("boostActivated", handleBoostActivated);
      };
    }
  }, [webSocket]);

  const activateFullEnergyBoost = () => {
    if (webSocket) {
      webSocket.emit(
        "activateBoost",
        JSON.stringify([user?.tgId, "fullEnergyBoost"])
      );
      
      if (fullEnergyActivates < 3) {
        const notify: NotifyMessage = {
          status: "ok",
          className: "h-72",
          message: "The energy has been restored",
        };
        notifyContext?.setNotify(notify);
      } else {
        const notify: NotifyMessage = {
          status: "error",
          className: "h-72",
          message: "You can't restore energy today",
        };
        notifyContext?.setNotify(notify);
      }
    }
  };

  const improveClick = () => {
    if (webSocket) {
      webSocket.emit("upgradeClick", user?.tgId);
    }
    if (
      startClickUpgradeCost * 2 ** ((user?.clickPower || 2) - 1) <=
      (user?.balance || 0)
    ) {
      const notify: NotifyMessage = {
        status: "ok",
        className: "h-72",
        message: "The power of your click has been enhanced",
      };
      notifyContext?.setNotify(notify);
    } else {
      const notify: NotifyMessage = {
        status: "error",
        className: "h-72",
        message: "You don't have enough balance",
      };
      notifyContext?.setNotify(notify);
    }
  };

  const upgradeEnergy = () => {
    if (webSocket) {
      webSocket.emit("upgradeEnergy", user?.tgId);
    }
    if (
      startEnergyUpgradeCost * 2 ** ((user?.energyLevel || 2) - 1) <=
      (user?.balance || 0)
    ) {
      const notify: NotifyMessage = {
        status: "ok",
        className: "h-72",
        message: "The energy has been enhanced",
      };
      notifyContext?.setNotify(notify);
    } else {
      const notify: NotifyMessage = {
        status: "error",
        className: "h-72",
        message: "You don't have enough balance",
      };
      notifyContext?.setNotify(notify);
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

  const onClose = () => {
    setModalOpen(false);
  };
  const onPurchase = () => {
    // onClose();

    switch (selectedBoost?.id) {
      case 0:
        activateFullEnergyBoost();
        break;
      case 1:
        improveClick();
        break;
      case 2:
        upgradeEnergy();
        break;
    }
  };

  const purchaseText = useMemo(() => {
    switch (selectedBoost?.id) {
      case 0:
        return selectedBoost.purchaseText(1);
      case 1:
        return selectedBoost.purchaseText(
          startClickUpgradeCost * 2 ** ((user?.clickPower || 2) - 1)
        );
      case 2:
        return selectedBoost.purchaseText(
          startClickUpgradeCost * 2 ** ((user?.energyLevel || 2) - 1)
        );
      default:
        return "";
    }
  }, [selectedBoost, user]);

  const additionalInfo = useMemo(() => {
    if (!selectedBoost?.additionalInfo) {
      return "";
    }
    switch (selectedBoost?.id) {
      case 0:
        return "";
      case 1:
        return selectedBoost.additionalInfo((user?.clickPower || 1) + 1);
      case 2:
        return selectedBoost.additionalInfo((user?.energyLevel || 1) + 1);

      default:
        return "";
    }
  }, [selectedBoost, user]);

  return (
    <div className="font-sans p-5 pt-0 rounded-lg max-w-md mx-auto">
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
              onClick={() => {
                setModalOpen(true);
                setSelectedBoost(boosts[0]);
              }}
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
              onClick={() => {
                setModalOpen(true);
                setSelectedBoost(boosts[1]);
              }}
              className="p-1 rounded-lg"
              style={{
                background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
              }}
            >
              Improve
            </button>
          </div>
        </div>

        <div className="flex justify-around mt-12">
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
            <div className="flex justify-center mb-2 mt-5">Upgrade energy</div>
            <div className="flex justify-center text-xl mb-1">
              {user?.energyLevel} lvl
            </div>
            <button
              onClick={() => {
                setModalOpen(true);
                setSelectedBoost(boosts[2]);
              }}
              className="p-1 rounded-lg"
              style={{
                background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
              }}
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && selectedBoost && (
        <BoostModal
          Icon={selectedBoost.Icon}
          eggIcon={selectedBoost.eggIcon}
          title={selectedBoost.title}
          purchaseText={purchaseText}
          additionalInfo={additionalInfo}
          onClose={onClose}
          onPurchase={onPurchase}
          description={selectedBoost.description}
        />
      )}
    </div>
  );
};
