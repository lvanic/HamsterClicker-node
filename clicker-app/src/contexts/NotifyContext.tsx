import { FC, ReactNode, createContext, useState } from "react";
import { Notification } from "../components/Notification";

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

  const setNotify = (notify: NotifyMessage) => {
    setNotifyMessage(notify);
  };
  const onClose = () => {
    setNotifyMessage(null);
  };
  return (
    <NotifyContext.Provider value={{ notify, setNotify }}>
      {notify != null && <Notification notify={notify} onClose={onClose} />}
      {children}
    </NotifyContext.Provider>
  );
};

export { NotifyContext, NotifyProvider };
