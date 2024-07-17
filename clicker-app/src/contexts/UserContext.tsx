import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  FC,
  useContext,
  useLayoutEffect,
} from "react";
import { useWebSocket } from "../hooks/useWebsocket";
import { User } from "../models";
import { WebSocketContext } from "./WebsocketContext";
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

const UserProvider: FC<UserProviderProps> = ({ children, user_id }) => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const { webSocket } = useWebSocket();

  const handleGetUser = (userData: any) => {
    console.log(userData);
    
    setUser({
      ...userData,
      totalIncomePerHour: userData.totalIncomePerHour,
      league: { ...userData.league._doc, id: userData.league.id },
      userPlaceInLeague: userData.userPlaceInLeague,
    });
  };

  useLayoutEffect(() => {
    const tgUser = getTelegramUser();
    if (webSocket && tgUser.id != -1) {
      webSocket.on("user", handleGetUser);
      const telegramUser = getTelegramUser();

      webSocket.emit("getUser", telegramUser.id);
      return () => {
        webSocket.off("user", handleGetUser);
      };
    }
  }, [location, webSocket]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
