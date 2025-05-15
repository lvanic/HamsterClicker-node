import React, { useState, useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebsocket";
import { League, User } from "../../models";
import { formatNumberWithoutDot } from "../../utils/formatNumber";

export const LeagueTop = () => {
  const { user } = useUser();
  const { webSocket } = useWebSocket();
  const [league, setLeague] = useState<League | null>(null);
  const [usersInLeague, setUsersInLeague] = useState(0);
  const [topUsersInLeague, setTopUsersInLeague] = useState<User[]>([]);

  useEffect(() => {
    if (webSocket && user?.league.id) {
      webSocket.emit("getLeagueInfo", {
        leagueId: user?.league.id,
        topUsersCount: 10,
      });

      webSocket.on("league", (data) => {
        setLeague(data.league);
        setUsersInLeague(data.usersInLeague);
        setTopUsersInLeague(data.topUsersInLeague);
      });

      return () => {
        webSocket.off("league");
      };
    }
  }, [webSocket, user?.league.id]);

  useEffect(() => {
    if (typeof window.Telegram.WebApp !== "undefined") {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(() => {
        window.history.back();
      });
    }
    return () => {
      if (typeof window.Telegram.WebApp !== "undefined") {
        window.Telegram.WebApp.BackButton.hide();
      }
    };
  }, []);

  const userPlace = user?.userPlaceInLeague;

  return (
    <div className="pt-0 px-4 rounded-lg overflow-scroll h-full pb-8">
      <img src="/img/boost-your-rank.png" alt="Boost Your Rank" />

      <div className="flex flex-col justify-center items-center rounded-xl mt-2 mb-2 p-4">
        <ul className="list-none w-full relative m-x-full">
          {userPlace && userPlace > 10 && (
            <li
              className="flex justify-between items-center rounded-3xl p-4 my-1 shadow-sm mb-4"
              style={{
                background:
                  "linear-gradient(57.26deg, #761B3F 0%, #78490D 100%)",
              }}
            >
              <div className="flex flex-col justify-start">
                <div>{user?.firstName || "Anonimus"}</div>
                <div>{formatNumberWithoutDot(user?.score || 0)}</div>
              </div>
              <div className="flex text-2xl font-bold justify-center items-center bg-[#FFAE4C] rounded-full w-10 h-10">
                {userPlace - 1}
              </div>
            </li>
          )}
          {topUsersInLeague.length > 0 ? (
            topUsersInLeague.map((userL: User, index: number) => {
              const isTop3 = index < 3;
              return (
                <li
                  key={userL.tgId}
                  className="flex justify-between items-center rounded-xl p-2 my-1 shadow-sm relative overflow-hidden"
                  style={{
                    background: isTop3
                      ? "linear-gradient(57.26deg,rgb(164, 66, 255) 0%, #FF428D 100%)"
                      : "linear-gradient(57.26deg, #FF428D 0%, #FFAE46 100%)",
                  }}
                >
                  <img
                    className="absolute w-full h-full left-0 top-0"
                    src="/img/friend-mask.png"
                  />
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex text-2xl font-bold justify-center items-center bg-[#FFAE4C] rounded-full min-w-10 w-10 h-10">
                      {index + 1}
                    </div>
                    <div className="text-ellipsis overflow-hidden whitespace-nowrap max-w-[calc(100%-6rem)]">
                      {userL.firstName.slice(0, 25) || "Anonimus"}
                    </div>

                    <div className="min-w-[4rem]">
                      {formatNumberWithoutDot(userL.score)}
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <div className="text-center text-xs mt-2">No users in league</div>
          )}
        </ul>
      </div>
    </div>
  );
};
