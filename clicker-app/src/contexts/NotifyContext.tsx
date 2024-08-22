import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Notification } from "../components/Notification";
import { useWebSocket } from "../hooks/useWebsocket";
import { UserContext } from "./UserContext";
import { formatNumber } from "../utils/formatNumber";

export interface NotifyMessage {
  message: string;
  closeButton?: boolean;
  status?: "ok" | "error" | "task" | "unknown";
  className?: string;
}

interface NotifyContextProps {
  notify: NotifyMessage | null;
  setNotify: (notify: NotifyMessage) => void;
}

const NotifyContext = createContext<NotifyContextProps | undefined>(undefined);

interface NotifyProviderProps {
  children: ReactNode;
}

const NotifyProvider: FC<NotifyProviderProps> = ({ children }) => {
  const [notify, setNotifyMessage] = useState<NotifyMessage | null>(null);
  const { webSocket } = useWebSocket();
  const userContext = useContext(UserContext);
  const [isStartNotifyShowed, setStartNotifyShowed] = useState(false);

  const setNotify = (notify: NotifyMessage) => {
    setNotifyMessage(notify);
  };
  const onClose = () => {
    setNotifyMessage(null);
  };

  const handleComboCompleted = () => {
    console.log("combo ok");

    const notify: NotifyMessage = {
      status: "ok",
      message: "You are successfully completed the combo game",
      className: "h-48",
    };

    setTimeout(() => {
      setNotify(notify);
    }, 3500);
  };

  useEffect(() => {
    if (!isStartNotifyShowed && userContext?.user?.lastOnlineTimestamp) {
      const MAX_OFFLINE_EARNINGS_HOURS = 3;

      const currentTime = new Date().getTime();
      const offlineTime = currentTime - userContext?.user.lastOnlineTimestamp;
      const offlineHours = offlineTime / (1000 * 60 * 60);
      console.log(offlineTime, userContext?.user?.cachedIncome);

      let earned = 0;
      if (offlineTime <= 0) {
        earned = 0;
      } else if (offlineHours <= MAX_OFFLINE_EARNINGS_HOURS) {
        earned = offlineHours * userContext?.user?.cachedIncome;
      } else {
        earned = MAX_OFFLINE_EARNINGS_HOURS * userContext?.user?.cachedIncome;
      }

      const notify: NotifyMessage = {
        status: "ok",
        message: `During your absence you earned ${formatNumber(earned)}`,
        className: "h-48",
      };
      setNotify(notify);
      setStartNotifyShowed(true);
    }
  }, [
    userContext?.user?.cachedIncome,
    userContext?.user?.lastOnlineTimestamp,
    isStartNotifyShowed,
  ]);

  useEffect(() => {
    webSocket?.on("comboCompleted", handleComboCompleted);
    // webSocket?.on("boostActivated", handleDailyReward);
    return () => {
      webSocket?.off("comboCompleted", handleComboCompleted);
      // webSocket?.off("boostActivated", handleDailyReward);
    };
  }, [webSocket]);
  return (
    <NotifyContext.Provider value={{ notify, setNotify }}>
      {notify != null && <Notification notify={notify} onClose={onClose} />}
      {children}
    </NotifyContext.Provider>
  );
};

export { NotifyContext, NotifyProvider };
