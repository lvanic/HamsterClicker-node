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
      className: "h-24",
    };

    setTimeout(() => {
      setNotify(notify);
    }, 2000);
  };

  useEffect(() => {
    if (!isStartNotifyShowed) {
      const earned = 200;
      const notify: NotifyMessage = {
        status: "ok",
        message: `During your absense you earned ${earned}`,
        className: "h-24",
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
