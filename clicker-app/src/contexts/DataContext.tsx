import { FC, ReactNode, createContext, useEffect, useState } from "react";
import { Business, Settings, Task } from "../models";
import { getConfig } from "../utils/config";

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

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { adminApiUrl } = getConfig();
    const response = await fetch(`${adminApiUrl}/admin/settings`);
    const settingsToSet = await response.json();
    setSettings(settingsToSet);
  };
  return (
    <DataContext.Provider
      value={{ businesses, setBusinesses, tasks, setTasks, settings }}
    >
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataProvider };
