import { Link, Outlet } from "react-router-dom";
import {
  AiOutlineHome,
  AiOutlineUser,
  AiOutlineCheckCircle,
  AiOutlineAim,
} from "react-icons/ai";
import { useWebSocket } from "../../hooks/useWebsocket";
import Loader from "../../components/Loader/Loader";
import { usePageLoading } from "../../hooks/usePageLoading";
import { useEffect, useMemo } from "react";
import { getPlatform } from "../../services/telegramService";
import QRCode from "react-qr-code";
import { getConfig } from "../../utils/config";
import QRCodeComponent from "../../components/QrCodeComponent";

export const Layout = () => {
  const { isPageLoading } = usePageLoading();
  const platform = useMemo(() => getPlatform(), [getPlatform]);
  console.log(platform);

  // if (platform !== "ios" && platform !== "android") {
  //   return <QRCodeComponent />;
  // }

  if (isPageLoading) {
    return <Loader />;
  }
  return (
    <>
      <Outlet />
      <nav className="fixed bottom-0 left-0 w-full bg-opacity-30 bg-gray-800 border-t border-gray-700 flex justify-around py-2 shadow-lg">
        <Link
          to="/"
          className="text-white text-center flex flex-col items-center text-sm transition duration-300"
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1e90ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
        >
          <AiOutlineHome size={24} className="mb-1" />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          to="/referrals"
          className="text-white text-center flex flex-col items-center text-sm transition duration-300"
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1e90ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
        >
          <AiOutlineUser size={24} className="mb-1" />
          <span className="text-xs">Referrals</span>
        </Link>
        <Link
          to="/tasks"
          className="text-white text-center flex flex-col items-center text-sm transition duration-300"
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1e90ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
        >
          <AiOutlineCheckCircle size={24} className="mb-1" />
          <span className="text-xs">Tasks</span>
        </Link>
        <Link
          to="/boosts"
          className="text-white text-center flex flex-col items-center text-sm transition duration-300"
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1e90ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
        >
          <AiOutlineAim size={24} className="mb-1" />
          <span className="text-xs">Boosts</span>
        </Link>
        <Link
          to="/businesses"
          className="text-white text-center flex flex-col items-center text-sm transition duration-300"
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1e90ff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
        >
          <AiOutlineAim size={24} className="mb-1" />
          <span className="text-xs">Businesses</span>
        </Link>
      </nav>
    </>
  );
};
