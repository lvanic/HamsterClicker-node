import React, { useState, useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebsocket";
import { Business } from "../../models";

export const Businesses = () => {
  const { user } = useUser();
  const { webSocket } = useWebSocket();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (webSocket && user) {
      console.log(user?.tgId);

      webSocket.emit("getBusinessesToBuy", user?.tgId);

      webSocket.on("businesses", (data) => {
        setBusinesses(data);
        console.log(data);
      });

      webSocket.on("businessBought", (data) => {
        if (data.success) {
          setMessage(`You have successfully bought ${data.business.name}`);
          setBusinesses((prev) =>
            prev.filter((b) => b.id !== data.business.id)
          );
        } else {
          setMessage("Failed to buy business");
        }
      });

      return () => {
        webSocket.off("businesses");
        webSocket.off("businessBought");
      };
    }
  }, [webSocket, user?.tgId]);

  const buyBusiness = (businessId: string) => {
    let request = JSON.stringify({
      userTgId: user?.tgId,
      businessId: businessId,
    });
    webSocket?.emit("buyBusiness", request);
  };

  return (
    <div className="font-sans p-5 rounded-lg max-w-md mx-auto shadow-md">
      <h2 className="text-2xl font-bold mb-4">Available Businesses</h2>
      {message && <p>{message}</p>}
      <ul
        className="space-y-4"
        style={{ maxHeight: window.innerHeight - 104, overflowY: "scroll" }}
      >
        {businesses.map((business) => (
          <li key={business.id} className="p-4 bg-white rounded shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{business.name}</h3>
                <p>{business.description}</p>
                <p>Price: {business.price}</p>
                <p>Reward per hour: {business.rewardPerHour}</p>
                <p>Refs to unlock: {business.refsToUnlock}</p>
              </div>
              <button
                onClick={() => buyBusiness(business.id)}
                className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Buy
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
