import { FC, ReactNode, createContext, useEffect, useState } from "react";
import { Business, Settings, Task } from "../models";
import { getConfig } from "../utils/config";
import { useWebSocket } from "../hooks/useWebsocket";
import { useUser } from "../hooks/useUser";

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

  const fetchSettings = async () => {
    const { adminApiUrl } = getConfig();
    const response = await fetch(`${adminApiUrl}/admin/settings`);
    const settingsToSet = await response.json();
    setSettings(settingsToSet);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (webSocket && user) {
      webSocket.emit("getBusinessesToBuy", user?.tgId);

      webSocket.on("businesses", (data) => {
        const parsedData = data.map((b: any) => ({
          id: b._id,
          ...b,
        }));
        setBusinesses(parsedData);
      });
      webSocket.emit("getTasks");

      webSocket.on("tasks", (receivedTasks) => {
        if (user?.completedTasks) {
          const updatedTasks = receivedTasks.map((task: any) => {
            const isCompleted = user?.completedTasks.some(
              (completedTask: any) => completedTask === task._id
            );

            return { ...task, completed: isCompleted };
          });
          setTasks(updatedTasks);
        } else {
          setTasks(receivedTasks);
        }
      });

      webSocket.on("businessBought", (data) => {
        webSocket.emit("getBusinessesToBuy", user?.tgId);
      });

      return () => {
        webSocket.off("businesses");
        webSocket.off("businessBought");
      };
    }
  }, [webSocket, user?.tgId, user?.completedTasks]);

  return (
    <DataContext.Provider
      value={{ businesses, setBusinesses, tasks, setTasks, settings }}
    >
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataProvider };
