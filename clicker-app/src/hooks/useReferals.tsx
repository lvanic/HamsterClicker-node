import { useEffect, useState } from "react";
import { useWebSocket } from "./useWebsocket";

type Referal = {
  id: number;
  avatar: string;
  name: string;
};

const useReferals = (): Referal[] | null => {
  const [referals, setReferals] = useState<Referal[] | null>(null);
  const { webSocket } = useWebSocket();

  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      setReferals(message.data);
    };

    if (webSocket) {
      webSocket.on("referrals", handleWebSocketMessage);

      webSocket.emit("getReferrals");

      return () => {
        webSocket.removeListener("message", handleWebSocketMessage);
      };
    }
  }, [webSocket]);

  return referals;
};

export default useReferals;
