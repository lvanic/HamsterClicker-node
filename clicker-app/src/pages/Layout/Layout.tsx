import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AiOutlineHome,
  AiOutlineUser,
  AiOutlineCheckCircle,
  AiOutlineAim,
} from "react-icons/ai";
import { useWebSocket } from "../../hooks/useWebsocket";
import Loader from "../../components/Loader/Loader";
import { usePageLoading } from "../../hooks/usePageLoading";
import { useEffect, useMemo, useState } from "react";
import { getPlatform } from "../../services/telegramService";
import QRCode from "react-qr-code";
import { getConfig } from "../../utils/config";
import QRCodeComponent from "../../components/QrCodeComponent";
import { BusinessSvg } from "./BusinessSvg";
import { FriendSvg } from "./FriendSvg";
import { EarnSvg } from "./EarnSvg";
import { EggSvg } from "./EggSvg";
import { HomeSvg } from "../../components/HomeSvg";

export const Layout = () => {
  const { isPageLoading } = usePageLoading();
  const platform = useMemo(() => getPlatform(), [getPlatform]);
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
      <Outlet />
      <nav className="fixed bottom-0 left-0 w-full bg-[#2525258C] border-t border-gray-700 flex justify-around pt-2 pb-4 shadow-lg flex items-center justify-center">
        <Link
          to="/"
          className={`w-16 h-14 text-white text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
            activeTab === "/" ? "bg-[#FD5463]" : ""
          }`}
        >
          <HomeSvg />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          to="/referrals"
          className={`w-16 h-14 text-white text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
            activeTab === "/referrals" ? "bg-[#FD5463]" : ""
          }`}
        >
          <FriendSvg />
          <span className="text-xs">Friends</span>
        </Link>
        <Link
          to="/businesses"
          className={`w-16 h-14 text-white text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
            activeTab === "/businesses" ? "bg-[#FD5463]" : ""
          }`}
        >
          <BusinessSvg />
          <span className="text-xs">Mine</span>
        </Link>
        <Link
          to="/tasks"
          className={`w-16 h-14 text-white text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
            activeTab === "/tasks" ? "bg-[#FD5463]" : ""
          }`}
        >
          <EarnSvg />
          <span className="text-xs">Earn</span>
        </Link>
        <Link
          to="/airdrop"
          className={`w-16 h-14 text-white text-center flex flex-col items-center justify-center text-sm transition duration-300 px-4 rounded-lg py-1 ${
            activeTab === "/airdrop" ? "bg-[#FD5463]" : ""
          }`}
        >
          <EggSvg />
          <span className="text-xs">Airdrop</span>
        </Link>
      </nav>
    </>
  );
};
