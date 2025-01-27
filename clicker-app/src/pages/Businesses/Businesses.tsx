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
import { BusinessesFilter } from "./BusinessesFilter";
import { getLocalization } from "../../localization/getLocalization";

export const Businesses = () => {
  const { user } = useUser();
  const { webSocket } = useWebSocket();
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business>();
  const notifyContext = useContext(NotifyContext);
  const context = useContext(DataContext);
  const [filter, setFilter] = useState<string>("Web3".toLocaleLowerCase());
  const [loadingBusinessIds, setLoadingBusinessIds] = useState<string[]>([]);

  useEffect(() => {
    if (webSocket && user) {
      webSocket.emit("getBusinessesToBuy", user?.tgId);
    }
  }, [webSocket, user?.tgId]);

  const buyBusiness = (businessId: string) => {
    setLoadingBusinessIds((prev) => [...prev, businessId]);

    const request = JSON.stringify([user?.tgId, businessId]);

    const business = context?.businesses.find((x) => x.id === businessId);

    if (business?.level === 0) {
      webSocket?.emit("buyBusiness", request);
    } else {
      webSocket?.emit("upgradeBusiness", request);
    }

    setModalOpen(false);
  };

  useEffect(() => {
    if (webSocket) {
      const handleBusinessBought = ({ success, id }: any) => {
        setLoadingBusinessIds((prev) =>
          prev.filter((businessId) => businessId !== id)
        );

        if (success) {
          const business = context?.businesses.find((x) => x.id === id);
          const notify: NotifyMessage = {
            status: "ok",
            message: `${business?.name} ${
              business?.level === 0
                ? getLocalization("wasPurchased")
                : getLocalization("wasUpgraded")
            }`,
            className: "h-72",
          };
          notifyContext?.setNotify(notify);
        } else {
          const notify: NotifyMessage = {
            status: "error",
            message: getLocalization("tryLater"),
            className: "h-72",
          };
          notifyContext?.setNotify(notify);
        }
      };

      webSocket.on("businessBought", handleBusinessBought);

      return () => {
        webSocket.off("businessBought", handleBusinessBought);
      };
    }
  }, [webSocket, context?.businesses, notifyContext]);
  return (
    <div className="p-5 pt-0 rounded-lg max-w-md mx-auto">
      <div
        className="relative h-28 mx-5 rounded-b-xl pt-4 text-black"
        style={{
          background: "linear-gradient(180deg, #FFCB83 0%, #FFAE4C 100%)",
          left: "0px",
          top: "0px",
          width: "-webkit-fill-available",
        }}
      >
        <div className="text-center">{getLocalization("myBalance")}</div>
        <div className="flex justify-center items-center">
          <LargerEggSvg />
          <div className="text-5xl ml-2">
            {formatNumber(user?.balance || 0)}
          </div>
        </div>
      </div>
      <div className="mt-4 mb-4 flex justify-between">
        <div className="bg-[#323232] p-3 rounded-xl mr-1">
          <div>{getLocalization("profitPerTap")}</div>
          <div className="flex justify-center items-center">
            <MediumEggSvg />
            <div className="text-3xl ml-2">+{user?.clickPower}</div>
          </div>
        </div>
        <div className="bg-[#323232] p-3 rounded-xl mx-1">
          <div>{getLocalization("scoreForUp")}</div>
          <div className="flex justify-center items-center">
            <div className="text-3xl">
              {formatNumber(user?.league.maxScore || 100000)}
            </div>
          </div>
        </div>
        <div className="bg-[#323232] p-3 rounded-xl ml-1">
          <div>{getLocalization("profitPerHour")}</div>
          <div className="flex justify-center items-center">
            <MediumEggSvg />
            <div className="text-3xl ml-2">
              {formatNumber(user?.totalIncomePerHour || 0)}
            </div>
          </div>
        </div>
      </div>
      <BusinessesFilter
        businesses={context?.businesses}
        onCategorySelect={(category) => {
          setFilter(category);
        }}
      />
      <div style={{ maxHeight: window.innerHeight - 382, overflowY: "scroll" }}>
        <div className="businesses-container">
          {!!user && context?.businesses && (
            <BusinessesList
              businesses={context?.businesses.filter(
                (x) =>
                  x.category.toLocaleLowerCase() == filter.toLocaleLowerCase()
              )}
              setModalOpen={setModalOpen}
              setSelectedBusiness={setSelectedBusiness}
              user={user}
              loadingBusinessIds={loadingBusinessIds}
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
