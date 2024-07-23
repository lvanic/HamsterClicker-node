import React, { useState, useEffect } from "react";
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

export const Businesses = () => {
  const { user } = useUser();
  const { webSocket } = useWebSocket();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [message, setMessage] = useState("");
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business>();

  useEffect(() => {
    if (webSocket && user) {
      webSocket.emit("getBusinessesToBuy", user?.tgId);

      webSocket.on("businesses", (data) => {
        console.log(data);

        const parsedData = data.map((b: any) => ({
          id: b._id,
          ...b,
        }));
        setBusinesses(parsedData);
      });

      webSocket.on("businessBought", (data) => {
        webSocket.emit("getBusinessesToBuy", user?.tgId);
      });

      return () => {
        webSocket.off("businesses");
        webSocket.off("businessBought");
      };
    }
  }, [webSocket, user?.tgId]);

  const buyBusiness = (businessId: string) => {
    let request = JSON.stringify([user?.tgId, businessId]);
    webSocket?.emit("buyBusiness", request);
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
          {businesses.map((business) => (
            <div
              key={business.id}
              className={`business-item  ${
                (user?.referrals?.length || 0) < business.refsToUnlock
                  ? "opacity-20"
                  : "opacity-100"
              }`}
              onClick={() => {
                if ((user?.referrals?.length || 0) >= business.refsToUnlock) {
                  setSelectedBusiness(business);
                  setModalOpen(true);
                }
              }}
            >
              <div className="flex justify-left items-center p-2 pb-2">
                <img
                  src={business.avatarUrl}
                  className="rounded-full w-8 h-8 mr-2"
                />
                <div>
                  <h3 style={{ fontSize: 10.2 }}>{business.name}</h3>
                  <div style={{ fontSize: 8 }} className="mt-2">
                    Reward per hour:
                    <div className="text-sm">
                      {formatNumber(business.rewardPerHour)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#5C5C5C] w-full h-10 rounded-xl flex items-center justify-between px-2">
                <div className="text-sm"> {business.level} lvl</div>
                <div>
                  <VerticalDivider />
                </div>
                <div className="flex items-center">
                  <EggSvg className="h-6" />
                  <div className="ml-1 text-sm">
                    {formatNumber(business.price)}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
