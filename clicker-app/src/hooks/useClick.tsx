import { User } from "../models";
import { getTelegramUser, webAppVibrate } from "../services/telegramService";
import { usePageLoading } from "./usePageLoading";
import { useSettings } from "./useSettings";
import { useUser } from "./useUser";
import { useWebSocket } from "./useWebsocket";
import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";

interface ClickData {
  user_id: number;
  position: { x: number; y: number };
  time_stamp: number;
}

export const useClick = () => {
  const { webSocket } = useWebSocket();
  const { user, setUser } = useUser();
  const { setPageLoading } = usePageLoading();

  const [clickCount, setClickCount] = useState<number>(
    user?.balance == undefined ? 0 : user.balance
  );
  const [energyCount, setEnergyCount] = useState<number>(
    user?.energy == undefined ? 1000 : user.energy
  );
  const energyIncrementInterval = useRef<NodeJS.Timeout | null>(null);

  const updateCounts = (clicks: number, energy: number) => {
    setClickCount(clicks);
    setEnergyCount(energy);
  };

  const handleClick = (clickData: ClickData) => {
    if (webSocket && energyCount > 0) {
      webSocket.emit("clickEvent", JSON.stringify(clickData));
      if (!setUser) {
        return;
      }

      setUser((prev) => {
        if (!prev) {
          return null;
        }

        if (prev.energy > 0) {
          webAppVibrate();
          updateCounts(prev.balance + 1, prev.energy - 1);
          return {
            ...prev,
            balance: prev.balance + 1,
            energy: prev.energy - 1,
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
    updateCounts(userData.balance, userData.energy);
  };

  useLayoutEffect(() => {
    if (user) {
      handleGetUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (energyIncrementInterval.current) {
      clearInterval(energyIncrementInterval.current);
    }

    energyIncrementInterval.current = setInterval(() => {
      if (!setUser) {
        return;
      }

      setUser((prev) => {
        if (!prev) {
          return null;
        }

        updateCounts(prev.balance + 1, prev.energy - 1);
        return {
          ...prev,
          energy: Math.min(prev.energy + 1, 1000),
        };
      });
    }, 5000);

    return () => {
      if (energyIncrementInterval.current) {
        clearInterval(energyIncrementInterval.current);
      }
    };
  }, []);

  return { handleClick, clickCount, energyCount };
};
