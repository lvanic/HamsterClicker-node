import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { User } from "../models";
import { getTelegramUser, webAppVibrate } from "../services/telegramService";
import { usePageLoading } from "./usePageLoading";
import { useSettings } from "./useSettings";
import { useUser } from "./useUser";
import { useWebSocket } from "./useWebsocket";

interface ClickData {
  user_id: number;
  position: { x: number; y: number };
  time_stamp: number;
}

export const useClick = () => {
  const { webSocket } = useWebSocket();
  const { user, setUser, setClicked } = useUser();
  const { setPageLoading } = usePageLoading();

  const [clickCount, setClickCount] = useState<number>(
    user?.balance == undefined ? 0 : user.balance
  );
  const [energyCount, setEnergyCount] = useState<number>(
    user?.energy == undefined ? 1000 : user.energy
  );

  const updateCounts = (clicks: number, energy: number, score: number) => {
    setClickCount(clicks);
    setEnergyCount(energy);
  };
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = (clickData: ClickData) => {
    if (webSocket && energyCount > 0) {
      webSocket.emit("clickEvent", JSON.stringify(clickData));
      if (setClicked) {
        setClicked(true);
      }
      if (!setUser) {
        return;
      }

      const newBalance = clickCount + (user?.clickPower || 1);
      const newEnergy = energyCount - 1;
      const newScore = (user?.score || 0) + (user?.clickPower || 1);

      updateCounts(newBalance, newEnergy, newScore);

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      clickTimeoutRef.current = setTimeout(() => {
        if (setClicked) {
          setClicked(false);
        }
      }, 5000);

      setUser((prev) => {
        if (!prev) {
          return null;
        }

        if (prev.energy > 0) {
          webAppVibrate();
          return {
            ...prev,
            score: newScore,
            balance: newBalance,
            energy: newEnergy,
          };
        } else {
          return prev;
        }
      });
    } else {
      console.error("WebSocket is not connected or no energy left");
    }
  };

  const handleGetUser = (userData: User) => {
    setPageLoading(false);
    updateCounts(userData.balance, userData.energy, userData.score);
  };

  useLayoutEffect(() => {
    if (user) {
      handleGetUser(user);
    }
  }, [user]);

  return { handleClick, clickCount, energyCount };
};
