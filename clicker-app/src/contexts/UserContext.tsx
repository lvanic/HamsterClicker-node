import React, {
  createContext,
  useState,
  ReactNode,
  FC,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useWebSocket } from "../hooks/useWebsocket";
import { User, Business, Task } from "../models";
import { getTelegramUser } from "../services/telegramService";
import Loader from "../components/Loader/Loader";

interface UserContextProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setClicked: (data: boolean) => void;
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
  maxEnergy: number;
  energyLevel: number;
  totalIncomePerHour?: number;
  deltaAddedFromBusinesses: number;
  deltaAddedEnergy: number;
  currentComboCompletions: any[];
}

const UserProvider: FC<UserProviderProps> = ({ children, user_id }) => {
  const [user, setUser] = useState<User | null>(null);
  const { webSocket } = useWebSocket();
  const clickRef = useRef<boolean>(false);
  const [isUserLoading, setUserLoading] = useState(true);

  const setClicked = useCallback((data: boolean) => {
    if (clickRef.current != data) {
      clickRef.current = data;
    } else {
    }
  }, []);

  const handleGetUser = (userData: any) => {
    setUserLoading(false);
    setUser({
      ...userData,
      totalIncomePerHour: userData.totalIncomePerHour,
      league: { ...userData.league, id: userData.league.id },
      userPlaceInLeague: userData.userPlaceInLeague,
    });
  };

  const handleLiteSync = useCallback((data: LiteSyncData) => {
    setUser((prev) => {
      if (!prev) {
        return null;
      }
      console.log(clickRef.current);

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
        balance: clickRef.current
          ? prev.balance + data.deltaAddedFromBusinesses
          : data.balance,
        score: clickRef.current
          ? prev.score + data.deltaAddedFromBusinesses
          : data.score,
        energyLevel: data.energyLevel || prev.energyLevel,
        maxEnergy: data.maxEnergy || prev.maxEnergy,
        energy: clickRef.current
          ? prev.energy + data.deltaAddedEnergy
          : data.energy,
        userPlaceInLeague: data.userPlaceInLeague,
        fullEnergyActivates:
          data.fullEnergyActivates || prev.fullEnergyActivates,
        lastFullEnergyTimestamp:
          data.lastFullEnergyTimestamp || prev.lastFullEnergyTimestamp,
        totalIncomePerHour: data.totalIncomePerHour || prev.totalIncomePerHour,
        currentComboCompletions:
          data?.currentComboCompletions?.map(c => c._id) || prev.currentComboCompletions,
      } as User;
    });
  }, []);

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (webSocket && tgUser.id !== -1) {
      webSocket.on("liteSync", handleLiteSync);
      webSocket.emit("subscribeLiteSync", tgUser.id);
    }
    return () => {
      webSocket?.off("liteSync", handleLiteSync);
    };
  }, [webSocket, handleLiteSync]);

  useEffect(() => {
    const tgUser = getTelegramUser();
    if (webSocket && tgUser.id !== -1) {
      webSocket.on("user", handleGetUser);
      webSocket.emit("getUser", tgUser.id);
    }
    return () => {
      webSocket?.off("user", handleGetUser);
    };
  }, [webSocket]);

  useEffect(() => {
    if (
      user?.league.maxScore &&
      user.score >= user.league.maxScore - 1 &&
      webSocket
    ) {
      webSocket.emit("getUser", user.tgId);
    }
  }, [webSocket, user]);

  return (
    <UserContext.Provider value={{ user, setUser, setClicked }}>
      {isUserLoading ? <Loader /> : children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
