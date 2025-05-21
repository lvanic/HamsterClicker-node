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
  multiplier: number;
}

export const useClick = () => {
  const { webSocket } = useWebSocket();
  const { user, setUser } = useUser();
  const { setPageLoading } = usePageLoading();

  const summaryClickPower = useMemo(() => {
    let multiplier = 1;
    const innerNow = Date.now();
    if (
      user?.isBoostX2Active &&
      user.x2ExpiresAt &&
      user.x2ExpiresAt > innerNow
    ) {
      return 2;
    }
    if (
      user?.isHandicapActive &&
      user.handicapExpiresAt &&
      user.handicapExpiresAt > innerNow
    ) {
      return 5;
    }
    return calculateLevel(user?.score || 0) * multiplier;
  }, [user]);

  const handleClick = (clickData: ClickData) => {
    if (webSocket && (user?.energy || 0) > 0) {
      if (!setUser) {
        return;
      }

      setUser((prev) => {
        if (!prev) {
          return null;
        }
        const now = Date.now();
        const isHandicapActive =
          prev.isHandicapActive &&
          prev.handicapExpiresAt &&
          new Date(prev.handicapExpiresAt).getTime() - now > 0;
        const isBoostX2Active =
          prev.isBoostX2Active &&
          prev.isBoostX2Active &&
          new Date(prev.x2ExpiresAt).getTime() - now > 0;

        const updatedScore =
          (prev.score || 0) + (summaryClickPower || 1) * clickData.multiplier;
        const updatedBalance =
          prev.balance + (summaryClickPower || 1) * clickData.multiplier;
        const updatedEnergy =
          prev.energy - (isBoostX2Active || isHandicapActive ? 0 : 1);

        if (prev.energy > 0) {
          webAppVibrate();
          webSocket.emit("clickEvent", JSON.stringify(clickData));
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
