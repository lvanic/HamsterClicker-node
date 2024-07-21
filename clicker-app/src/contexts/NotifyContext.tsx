import { FC, ReactNode, createContext, useState } from "react";

interface NotifyContextProps {
  notifyMessage: string | null;
  setNotify: (message: string, closeButton: boolean) => void;
}

const NotifyContext = createContext<NotifyContextProps | undefined>(undefined);

interface NotifyProviderProps {
  children: ReactNode;
}

const NotifyProvider: FC<NotifyProviderProps> = ({ children }) => {
  const [notifyMessage, setNotifyMessage] = useState<string | null>("Message");

  const setNotify = (message: string, closeButton: boolean) => {
    setNotifyMessage(message);
    setTimeout(() => {
      setNotifyMessage(null);
    }, 3000);
  };
  return (
    <NotifyContext.Provider value={{ notifyMessage, setNotify }}>
      {notifyMessage != null && <div>{notifyMessage}</div>}
      {children}
    </NotifyContext.Provider>
  );
};

export { NotifyContext, NotifyProvider };
