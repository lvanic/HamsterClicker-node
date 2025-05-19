import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { usePageLoading } from "../../hooks/usePageLoading";
import { useEffect, useMemo, useState } from "react";
import { getPlatform, getTelegramUser } from "../../services/telegramService";

import { getLocalization } from "../../localization/getLocalization";
import { LevelStatus } from "../../components/LevelStatus";
import { BoostButton } from "../../components/BoostButton";
import { StatsSvg } from "./StatsSvg";
import { FriendSvg } from "./FriendSvg";
import { WalletSvg } from "./WallerSvg";
import { HomeSvg } from "./HomeSvg";
import { MineSvg } from "./MineSvg";
import { useUser } from "../../hooks/useUser";
import { useSettings } from "../../hooks/useSettings";

export const Layout = () => {
  // const { isPageLoading } = usePageLoading();
  // const platform = useMemo(() => getPlatform(), [getPlatform]);
  const { user } = useUser();
  const { lastTaskAddedAt } = useSettings();

  const isNewTaskAdded = useMemo(() => {
    if (!lastTaskAddedAt) {
      return false;
    }
    const userLastOnline = user?.lastOnlineTimestamp;
    if (!userLastOnline) {
      return false;
    }

    return userLastOnline < lastTaskAddedAt;
  }, [lastTaskAddedAt, user?.lastOnlineTimestamp]);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const selectedLanguage =
      params.get("lang") || localStorage.getItem("language") || "en";

    if ((params.get("lang") || "eg") !== selectedLanguage) {
      params.set("lang", selectedLanguage);
      navigate(`?${params.toString()}`, { replace: true });
    }
  }, [navigate]);

  // if (platform !== "ios" && platform !== "android") {
  //   return <QRCodeComponent />;
  // }

  // if (isPageLoading) {
  //   return <Loader />;
  // }
  return (
    <>
      <div className="flex flex-row justify-between items-center w-full mt-1 mb-3 gap-2 px-3 pt-1">
        <div className="flex items-center gap-2">
          <img
            className="w-8 h-8 bg-[#F7B84B] rounded-xl"
            src={getTelegramUser().photo_url}
          />
          <div className="font-light">
            {getTelegramUser().first_name} {getTelegramUser().last_name?.[0]}
          </div>
        </div>
        <BoostButton />
        <LevelStatus />
      </div>
      <Outlet />
      <div className="fixed bottom-0 left-0 w-full px-2 pb-4">
        <nav
          className="border-t border-gray-700 flex justify-around py-2 px-1 shadow-lg flex items-center justify-center rounded-xl border border-dashed border-[#FFFFFF4D]"
          style={{
            background:
              "linear-gradient(180deg, rgba(229, 229, 229, 0.2) 0%, rgba(127, 127, 127, 0.2) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          <Link
            to="/tasks"
            className={`relative w-14 h-14  text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
              activeTab === "/tasks"
                ? "border border-[#FFAE4C] border-dashed"
                : ""
            }`}
          >
            {isNewTaskAdded && (
              <div className="w-2 h-2 bg-[#FD6717] animate-pulse absolute right-[4px] top-[4px] rounded-full" />
            )}

            <MineSvg isActive={activeTab === "/tasks"} />
            <span
              className={
                "text-xs font-light uppercase " +
                (activeTab === "/tasks" ? "text-[#FFAE4C]" : "")
              }
            >
              {getLocalization("mine")}
            </span>
          </Link>
          <Link
            to="/league"
            className={`w-14 h-14  text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
              activeTab === "/league"
                ? "border border-[#FFAE4C] border-dashed"
                : ""
            }`}
          >
            <StatsSvg isActive={activeTab === "/league"} />
            <span
              className={
                "text-xs font-light uppercase " +
                (activeTab === "/league" ? "text-[#FFAE4C]" : "")
              }
            >
              {getLocalization("statistics")}
            </span>
          </Link>
          <Link
            to="/"
            className={`w-14 h-14  text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
              activeTab === "/" ? "border border-[#FFAE4C] border-dashed" : ""
            }`}
          >
            <HomeSvg isActive={activeTab === "/"} />
            <span
              className={
                "text-xs font-light uppercase " +
                (activeTab === "/" ? "text-[#FFAE4C]" : "")
              }
            >
              {getLocalization("home")}
            </span>
          </Link>
          <Link
            to="/referrals"
            className={`w-14 h-14  text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
              activeTab === "/referrals"
                ? "border border-[#FFAE4C] border-dashed"
                : ""
            }`}
          >
            <FriendSvg isActive={activeTab === "/referrals"} />
            <span
              className={
                "text-xs font-light uppercase " +
                (activeTab === "/referrals" ? "text-[#FFAE4C]" : "")
              }
            >
              {getLocalization("friends")}
            </span>
          </Link>
          <Link
            to="/airdrop"
            className={`w-14 h-14  text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
              activeTab === "/airdrop"
                ? "border border-[#FFAE4C] border-dashed"
                : ""
            }`}
          >
            <WalletSvg isActive={activeTab === "/airdrop"} />
            <span
              className={
                "text-xs font-light uppercase " +
                (activeTab === "/airdrop" ? "text-[#FFAE4C]" : "")
              }
            >
              {getLocalization("wallet")}
            </span>
          </Link>
        </nav>
      </div>
    </>
  );
};
