import React, {
  createContext,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import { Socket, io } from "socket.io-client";
import MaintenanceNotice from "../pages/MaintenanceNotice/MaintenanceNotice";
import { usePageLoading } from "../hooks/usePageLoading";
import { useLocation } from "react-router-dom";

type WebSocketContextType = {
  webSocket: Socket | null;
  isSocketLive: boolean;
};

export const WebSocketContext = createContext<WebSocketContextType | null>(
  null
);

export const WebSocketProvider: React.FC<{
  children: React.ReactNode;
  url: string;
  user_id: number | undefined;
}> = ({ children, url, user_id }) => {
  const [webSocket, setWebSocket] = useState<Socket | null>(null);
  const [isSocketLive, setIsSocketLive] = useState<boolean>(true);
  const { setPageLoading } = usePageLoading();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes("admin")) {
      setPageLoading(false)
      return;
    }

    const socket = io(url, {
      reconnectionDelayMax: 1000,
      query: {
        user_id: user_id,
      },
    });

    setWebSocket(socket);
    setPageLoading(true);

    socket.on("disconnect", () => {
      console.log("Socket disconnected");

      setIsSocketLive(false);
      setPageLoading(false);
    });

    socket.on("connect_error", (error) => {
      console.log("Socket connection error", error);

      setIsSocketLive(false);
      setPageLoading(false);
    });

    socket.on("connect", () => {
      console.log("Socket connected");

      setIsSocketLive(true);
      setPageLoading(false);
    });

    return () => {
      socket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ webSocket, isSocketLive }}>
      {isSocketLive ? children : <MaintenanceNotice />}
    </WebSocketContext.Provider>
  );
};
