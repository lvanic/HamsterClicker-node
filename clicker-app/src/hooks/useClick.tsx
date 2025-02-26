import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { User } from "../models";
import { getTelegramUser, webAppVibrate } from "../services/telegramService";
import { usePageLoading } from "./usePageLoading";
import { useSettings } from "./useSettings";
import { useUser } from "./useUser";
import { useWebSocket } from "./useWebsocket";
import { calculateLevel } from "../utils/calculateLevel";

interface ClickData {
  user_id: number;
}

export const useClick = () => {
  const { webSocket } = useWebSocket();
  const { user, setUser } = useUser();
  const { setPageLoading } = usePageLoading();

  const summaryClickPower = useMemo(
    () => calculateLevel(user?.score || 0),
    [user]
  );

  const handleClick = (clickData: ClickData) => {
    if (webSocket && (user?.energy || 0) > 0) {
      webSocket.emit("clickEvent", JSON.stringify(clickData));
      if (!setUser) {
        return;
      }

      setUser((prev) => {
        if (!prev || prev.energy <= 0) {
          return null;
        }

        const updatedScore = (prev.score || 0) + (summaryClickPower || 1);
        const updatedBalance = prev.balance + (summaryClickPower || 1);
        const updatedEnergy = prev.energy - 1;

        if (prev.energy > 0) {
          webAppVibrate();
          return {
            ...prev,
            score: updatedScore,
            balance: updatedBalance,
            energy: updatedEnergy,
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
  };

  useLayoutEffect(() => {
    if (user) {
      handleGetUser(user);
    }
  }, [user]);

  return { handleClick };
};
