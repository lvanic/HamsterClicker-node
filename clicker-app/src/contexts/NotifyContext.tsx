import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import Notification from "../components/Notification";
import { useWebSocket } from "../hooks/useWebsocket";
import { UserContext } from "./UserContext";
import { formatNumber } from "../utils/formatNumber";
import { getLocalization } from "../localization/getLocalization";

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
  const [notifyQueue, setNotifyQueue] = useState<NotifyMessage[]>([]);
  const [currentNotify, setCurrentNotify] = useState<NotifyMessage | null>(
    null
  );
  const { webSocket } = useWebSocket();
  const userContext = useContext(UserContext);
  const [isStartNotifyShowed, setStartNotifyShowed] = useState(false);

  const setNotify = (notify: NotifyMessage) => {
    setNotifyQueue((prevQueue) => [...prevQueue, notify]);
  };

  const showNextNotify = () => {
    if (notifyQueue.length > 0) {
      setCurrentNotify(notifyQueue[0]);

      // Таймер на 3 секунды, затем удаляем текущее уведомление из очереди
      const timer = setTimeout(() => {
        setNotifyQueue((prevQueue) => prevQueue.slice(1));
        setCurrentNotify(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  };

  useEffect(() => {
    if (!currentNotify && notifyQueue.length > 0) {
      showNextNotify();
    }
  }, [notifyQueue, currentNotify]);

  const handleComboCompleted = (data: any) => {
    const notify: NotifyMessage = {
      status: "ok",
      message: `You successfully completed the combo game and received ${data.reward}`,
    };
    setNotify(notify);
  };

  useEffect(() => {
    if (!isStartNotifyShowed && userContext?.user?.lastOnlineTimeStamp) {
      const MAX_OFFLINE_EARNINGS_HOURS = 3;

      const currentTime = new Date().getTime();
      const offlineTime = currentTime - userContext?.user.lastOnlineTimeStamp;
      const offlineHours = offlineTime / (1000 * 60 * 60);

      if (offlineTime / 1000 / 60 < 5) {
        return;
      }

      let earned = 0;
      if (offlineHours <= MAX_OFFLINE_EARNINGS_HOURS) {
        earned = offlineHours * userContext?.user?.cachedIncome;
      } else {
        earned = MAX_OFFLINE_EARNINGS_HOURS * userContext?.user?.cachedIncome;
      }

      const notify: NotifyMessage = {
        status: "ok",
        message: `${getLocalization("youEarned")} ${formatNumber(earned)}`,
      };

      if (earned >= 1) {
        setNotify(notify);
      }

      setStartNotifyShowed(true);
    }
  }, [
    userContext?.user?.cachedIncome,
    userContext?.user?.lastOnlineTimeStamp,
    isStartNotifyShowed,
  ]);

  useEffect(() => {
    webSocket?.on("comboCompleted", handleComboCompleted);

    return () => {
      webSocket?.off("comboCompleted", handleComboCompleted);
    };
  }, [webSocket]);

  return (
    <NotifyContext.Provider value={{ notify: currentNotify, setNotify }}>
      {currentNotify && (
        <Notification notify={currentNotify} onClose={showNextNotify} />
      )}
      {children}
    </NotifyContext.Provider>
  );
};

export { NotifyContext, NotifyProvider };
