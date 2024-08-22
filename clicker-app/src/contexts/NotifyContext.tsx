import { FC, ReactNode, createContext, useEffect, useState } from "react";
import { Notification } from "../components/Notification";
import { useWebSocket } from "../hooks/useWebsocket";

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
    };
    setTimeout(() => {
      setNotify(notify);
    }, 2000);
  };

  const handleDailyReward = (data: string) => {
    const notify: NotifyMessage = {
      status: "ok",
      message: data,
    };

    setNotify(notify);
  };

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
