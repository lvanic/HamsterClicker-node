import React, { useState, useEffect, useContext } from "react";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebsocket";
import { Business } from "../../models";
import { MediumEggSvg } from "./MediumEggSvg";
import { LargerEggSvg } from "./LargerEggSvg";
import "./Businesses.css";
import { SmallEggSvg } from "../../components/SmallEggSvg";
import { EggSvg } from "../Layout/EggSvg";
import { BuyBusiness } from "./BuyBusiness";
import { formatNumber } from "../../utils/formatNumber";
import { VerticalDivider } from "../../components/VerticalDivider";
import { NotifyContext, NotifyMessage } from "../../contexts/NotifyContext";
import { BusinessesList } from "./BusinessesList";
import { DataContext } from "../../contexts/DataContext";

export const Businesses = () => {
  const { user } = useUser();
  const { webSocket } = useWebSocket();
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business>();
  const notifyContext = useContext(NotifyContext);
  const context = useContext(DataContext);

  useEffect(() => {
    if (webSocket && user) {
      webSocket.emit("getBusinessesToBuy", user?.tgId);
    }
  }, [webSocket, user?.tgId]);

  const buyBusiness = (businessId: string) => {
    let request = JSON.stringify([user?.tgId, businessId]);
    let notify: NotifyMessage;
    if (context?.businesses.find((x) => x.id == businessId)?.level == 0) {
      webSocket?.emit("buyBusiness", request);
      notify = {
        status: "ok",
        message: "Business was purchased",
        className: "h-72",
      };
    } else {
      notify = {
        status: "ok",
        message: "Business was upgraded",
        className: "h-72",
      };
      webSocket?.emit("upgradeBusiness", request);
    }
    notifyContext?.setNotify(notify);
    setModalOpen(false);
  };

  return (
    <div className="p-5 pt-0 rounded-lg max-w-md mx-auto">
      <div
        className="relative h-28 mx-5 rounded-b-xl pt-4"
        style={{
          background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
          left: "0px",
          top: "0px",
          width: "-webkit-fill-available",
        }}
      >
        <div className="text-center">My balance</div>
        <div className="flex justify-center items-center">
          <LargerEggSvg />
          <div className="text-5xl ml-2">
            {formatNumber(Math.floor(user?.balance || 0))}
          </div>
        </div>
      </div>
      <div className="mt-4 mb-4 flex justify-between">
        <div className="bg-[#323232] p-3 rounded-xl mr-1">
          <div>Profit per tap</div>
          <div className="flex justify-center items-center">
            <MediumEggSvg />
            <div className="text-3xl ml-2">+{user?.clickPower}</div>
          </div>
        </div>
        <div className="bg-[#323232] p-3 rounded-xl mx-1">
          <div>Coins for up</div>
          <div className="flex justify-center items-center">
            <div className="text-3xl">
              {formatNumber(user?.league.maxScore || 100000)}
            </div>
          </div>
        </div>
        <div className="bg-[#323232] p-3 rounded-xl ml-1">
          <div>Profit per hour</div>
          <div className="flex justify-center items-center">
            <MediumEggSvg />
            <div className="text-3xl ml-2">
              {formatNumber(user?.totalIncomePerHour || 0)}
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxHeight: window.innerHeight - 314, overflowY: "scroll" }}>
        <div className="businesses-container">
          {!!user && context?.businesses && (
            <BusinessesList
              businesses={context?.businesses}
              setModalOpen={setModalOpen}
              setSelectedBusiness={setSelectedBusiness}
              user={user}
            />
          )}
        </div>
      </div>

      {isModalOpen && selectedBusiness && (
        <BuyBusiness
          business={selectedBusiness}
          onBuyBusiness={buyBusiness}
          onClose={() => {
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
