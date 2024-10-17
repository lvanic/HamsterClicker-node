import {
  FC,
  ReactNode,
  createContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { Business, Settings, Task } from "../models";
import { getConfig } from "../utils/config";
import { useWebSocket } from "../hooks/useWebsocket";
import { useUser } from "../hooks/useUser";
import { getTelegramUser } from "../services/telegramService";

interface DataContextProps {
  businesses: Business[];
  setBusinesses: (data: any) => void;

  tasks: Task[];
  setTasks: (data: any) => void;

  settings: Settings | null;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

const DataProvider: FC<DataProviderProps> = ({ children }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const { webSocket } = useWebSocket();
  const { user } = useUser();
  const [isSubscribeDone, setSubscribeDone] = useState(false);

  const fetchSettings = async () => {
    const { adminApiUrl } = getConfig();
    const response = await fetch(`${adminApiUrl}/app-settings`);
    const settingsToSet = await response.json();
    setSettings(settingsToSet);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (webSocket && user) {
      webSocket.on("businesses", (data) => {
        const parsedData = data.map((b: any) => ({
          id: b._id,
          ...b,
        }));
        setBusinesses(parsedData);
      });

      webSocket.on("tasks", (receivedTasks) => {
        if (user?.completedTasks) {
          console.log(user?.completedTasks);

          const updatedTasks = receivedTasks.map((task: any) => {
            const isCompleted = user?.completedTasks.some(
              (completedTask: any) => completedTask.id == task._id
            );

            return { ...task, completed: isCompleted };
          });
          setTasks(updatedTasks);
        } else {
          setTasks(receivedTasks);
        }
      });

      // setSubscribeDone(true);
      return () => {
        webSocket.off("tasks");
        webSocket.off("businesses");
      };
    }
  }, [webSocket, user?.completedTasks]);

  useEffect(() => {
    if (webSocket) {
      const tgUser = getTelegramUser();
      webSocket.emit("getTasks");
      webSocket.emit("getBusinessesToBuy", tgUser.id);

      webSocket.on("businessBought", (data) => {
        webSocket.emit("getBusinessesToBuy", tgUser.id);
      });

      return () => {
        webSocket.off("businessBought");
      };
    }
  }, [webSocket]);

  return (
    <DataContext.Provider
      value={{ businesses, setBusinesses, tasks, setTasks, settings }}
    >
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataProvider };
