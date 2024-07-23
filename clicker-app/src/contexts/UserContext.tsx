import React, {
  createContext,
  useState,
  ReactNode,
  FC,
  useEffect,
} from "react";
import { useWebSocket } from "../hooks/useWebsocket";
import { User, Business, Task } from "../models";
import { useLocation } from "react-router-dom";
import { getTelegramUser } from "../services/telegramService";

interface UserContextProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  user_id: number | undefined;
}

interface LiteSyncData {
  newBusinesses?: Business[];
  referrals?: User[];
  completedTasks?: Task[];
  energy: number;
  clickPower?: number;
  lastDailyRewardTimestamp?: number;
  fullEnergyActivates?: number;
  lastFullEnergyTimestamp?: number;
  balance: number;
  score: number;
  userPlaceInLeague: number;
}

const UserProvider: FC<UserProviderProps> = ({ children, user_id }) => {
  const [user, setUser] = useState<User | null>(null);
  const { webSocket } = useWebSocket();

  const handleGetUser = (userData: any) => {
    console.log(userData);

    setUser({
      ...userData,
      totalIncomePerHour: userData.totalIncomePerHour,
      league: { ...userData.league, id: userData.league.id },
      userPlaceInLeague: userData.userPlaceInLeague,
    });
  };

  const handleLiteSync = (data: LiteSyncData) => {
    setUser((prev) => {
      if (!prev) {
        return null;
      }

      return {
        ...prev,
        businesses: [...prev.businesses, ...(data.newBusinesses || [])],
        referrals: [...prev.referrals, ...(data.referrals || [])],
        completedTasks: [
          ...prev.completedTasks,
          ...(data.completedTasks || []),
        ],
        clickPower: data.clickPower || prev.clickPower,
        lastDailyRewardTimestamp:
          data.lastDailyRewardTimestamp || prev.lastDailyRewardTimestamp,
        balance: data.balance,
        score: data.score,
        energy: data.energy,
        userPlaceInLeague: data.userPlaceInLeague,
        fullEnergyActivates:
          data.fullEnergyActivates || prev.fullEnergyActivates,
        lastFullEnergyTimestamp:
          data.lastFullEnergyTimestamp || prev.lastFullEnergyTimestamp,
      } as User;
    });
  };

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (webSocket && tgUser.id != -1) {
      webSocket.on("liteSync", handleLiteSync);
      webSocket.emit("subscribeLiteSync", tgUser.id);

      webSocket.on("user", handleGetUser);
      webSocket.emit("getUser", tgUser.id);

      return () => {
        webSocket.off("user", handleGetUser);
        webSocket.off("liteSync", handleLiteSync);
      };
    }
  }, [webSocket]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
