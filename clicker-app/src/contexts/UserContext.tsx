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
import { useLocation } from "react-router-dom";

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
  completedTasks?: any[];
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
  currentComboCompletions: any[];
}

const UserProvider: FC<UserProviderProps> = ({ children, user_id }) => {
  const [user, setUser] = useState<User | null>(null);
  const { webSocket, isSocketLive } = useWebSocket();
  const clickRef = useRef<boolean>(false);
  const [isUserLoading, setUserLoading] = useState(true);
  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [isLeagueRequested, setLeagueRequested] = useState(false);

  const location = useLocation();

  const setClicked = useCallback((data: boolean) => {
    if (clickRef.current != data) {
      clickRef.current = data;
    } else {
    }
  }, []);

  const handleGetUser = (userData: any) => {
    setUserLoading(false);

    setUser((prev) => ({
      ...userData,
      totalIncomePerHour: userData.totalIncomePerHour,
      league: { ...userData.league, id: userData.league.id },
      userPlaceInLeague: userData.userPlaceInLeague,
      cachedIncome: userData.totalIncomePerHour,
      energy:
        prev?.energy != null
          ? prev?.energy
          : userData.energy < userData.maxEnergy
          ? userData.energy <= 0
            ? 0
            : userData.energy
          : userData.maxEnergy,
    }));
  };

  const handleLiteSync = useCallback((data: LiteSyncData) => {
    setUser((prev) => {
      if (!prev) {
        return null;
      }
      // alert(prev.maxEnergy)
      return {
        ...prev,
        businesses: [...prev.businesses, ...(data.newBusinesses || [])],
        referrals: [...prev.referrals, ...(data.referrals || [])],
        completedTasks: [
          ...prev.completedTasks,
          ...(data.completedTasks?.map((t) => ({ id: t._id, ...t })) || []),
        ],
        clickPower: data.clickPower || prev.clickPower,
        lastDailyRewardTimestamp:
          data.lastDailyRewardTimestamp || prev.lastDailyRewardTimestamp,
        balance: data.balance,
        score: data.score,
        energyLevel: data.energyLevel || prev.energyLevel,
        maxEnergy: data.maxEnergy || prev.maxEnergy,
        energy:
          prev.energy + 1 >= prev.maxEnergy
            ? prev.maxEnergy
            : prev.energy + 1 < 0
            ? 0
            : prev.energy + 1,
        userPlaceInLeague: data.userPlaceInLeague,
        fullEnergyActivates:
          data.fullEnergyActivates || prev.fullEnergyActivates,
        lastFullEnergyTimestamp:
          data.lastFullEnergyTimestamp || prev.lastFullEnergyTimestamp,
        totalIncomePerHour: data.totalIncomePerHour || prev.totalIncomePerHour,
        cachedIncome: prev.cachedIncome,
        lastOnlineTimestamp: prev.lastOnlineTimestamp,
        currentComboCompletions:
          data?.currentComboCompletions != undefined
            ? [
                data?.currentComboCompletions?.map((c) => c._id),
                ...prev.currentComboCompletions.filter(
                  (c) => !data.currentComboCompletions.some((x) => x == c)
                ),
              ]
            : prev.currentComboCompletions,
      } as User;
    });
  }, []);

  const handleUserLeague = (leagueInfo: any) => {
    setLeagueRequested(false);
    setUser((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        league: { ...leagueInfo.userLeague, id: leagueInfo.userLeague._id },
        userPlaceInLeague: leagueInfo.userPlaceInLeague,
        userLevel: leagueInfo.userLevel,
      };
    });
  };
  const handleRestoreEnergy = (info: any) => {
    setUser((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        energy: prev.maxEnergy,
      };
    });
  };

  useEffect(() => {
    if (
      webSocket?.connected &&
      user?.tgId &&
      user.score >= user.league.maxScore &&
      !isLeagueRequested &&
      user.userLevel < user.maxLevel
    ) {
      webSocket.emit("userLeague", user?.tgId);
      setLeagueRequested(true);
    }
  }, [webSocket?.connected, user?.score, isLeagueRequested]);

  useEffect(() => {
    if (webSocket?.connected && user?.tgId) {
      webSocket.on("userLeague", handleUserLeague);
    }
    return () => {
      webSocket?.off("userLeague", handleUserLeague);
    };
  }, [webSocket?.connected, user?.tgId]);

  useEffect(() => {
    if (location.pathname.includes("admin")) {
      setUserLoading(false);
      return;
    }

    // if (webSocket?.connected && user?.tgId) {
    //   webSocket.on("liteSync", handleLiteSync);
    //   webSocket.emit("subscribeLiteSync", user?.tgId);
    // }
    // return () => {
    //   webSocket?.off("liteSync", handleLiteSync);
    //   webSocket?.emit("unsubscribeLiteSync");
    // };
  }, [webSocket?.connected, handleLiteSync, user?.tgId, isSocketLive]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUser((prev) => {
        if (!prev || prev.energy >= prev.maxEnergy) {
          // clearInterval(interval);
          return prev;
        }

        const balanceIncreasePerSecond = prev.totalIncomePerHour / 3600;

        const newEnergy = Math.min(prev.energy + 1, prev.maxEnergy);

        return {
          ...prev,
          energy: newEnergy,
          score: prev.score + balanceIncreasePerSecond,
          balance: prev.balance + balanceIncreasePerSecond,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.tgUsername]);

  const handleRewardGet = (amount: number) => {
    setUser((prev) => {
      if (!prev) {
        return null;
      }
      return {
        ...prev,
        balance: prev?.balance + amount,
        score: prev?.score + amount,
      };
    });
  };
  useEffect(() => {
    if (webSocket?.connected) {
      webSocket.on("reward", handleRewardGet);
      webSocket.on("energyRestored", handleRestoreEnergy);
    }
    return () => {
      webSocket?.off("reward", handleRewardGet);
      webSocket?.off("energyRestored", handleRestoreEnergy);
    };
  }, [webSocket?.connected, isSocketLive]);

  useEffect(() => {
    if (location.pathname.includes("admin")) {
      setUserLoading(false);
      return;
    }
    const tgUser = getTelegramUser();

    if (webSocket?.connected && tgUser.id !== -1) {
      setTimeout(() => {
        webSocket.on("user", handleGetUser);
        webSocket.emit("getUser", tgUser.id);
      }, 300);
    }
    return () => {
      webSocket?.off("user", handleGetUser);
    };
  }, [webSocket?.connected, isSocketLive]);

  useEffect(() => {
    if (isUserLoading) {
      const interval = setInterval(() => {
        setLoadingPercentage((prev) => {
          if (prev < 98) {
            return prev + 2;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 30);
    }
  }, [isUserLoading]);

  return (
    <UserContext.Provider value={{ user, setUser, setClicked }}>
      {isUserLoading ? <Loader /> : children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
