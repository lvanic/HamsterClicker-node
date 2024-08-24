import React, { useState, useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebsocket";
import { League, User } from "../../models";
import { formatNumber } from "../../utils/formatNumber";

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
      console.log("show");

      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(function () {
        window.history.back();
      });
    }
    return () => {
      if (typeof window.Telegram.WebApp !== "undefined") {
        window.Telegram.WebApp.BackButton.hide();
      }
    };
  }, []);

  return (
    <div className="pt-0 px-4 rounded-lg overflow-scroll h-full pt-10">
      <div className="px-16">
        <div
          className="gradient-border-container mb-2"
          style={{
            aspectRatio: "1",
          }}
        >
          <img className="rounded-full" src={user?.league.avatarUrl} />
        </div>
      </div>
      <div className="flex flex-col items-center mt-4">
        <div className="uppercase text-xl">{user?.league.name}</div>
        <div className="flex gap-1 text-[#515A70]">
          <div>{formatNumber(user?.score || 0)}</div>
          <div>/</div>
          <div>{formatNumber(user?.league.maxScore || 0)}</div>
        </div>
      </div>
      <div className="flex flex-col justify-center  items-center rounded-xl mt-8 mb-2 p-4">
        <div className="text-center mb-2">Top Users in League</div>
        <ul
          className="list-none w-full relative m-x-full"
          // style={{ maxHeight: window.innerHeight - 600, overflowY: "scroll" }}
        >
          {topUsersInLeague.length > 0 ? (
            topUsersInLeague.map((userL: User, index: number) => (
              <li
                key={userL.tgId}
                className="flex justify-between items-center bg-[#383838] rounded-3xl p-4 my-1 shadow-sm"
              >
                <div className="flex flex-col justify-start">
                  <div>{userL.firstName || "Anonimus"}</div>
                  <div> {formatNumber(userL.score)}</div>
                </div>
                <div className="flex text-2xl font-bold justify-center items-center bg-[#FD5463] rounded-full w-10 h-10">
                  {index + 1}
                </div>
              </li>
            ))
          ) : (
            <div className="text-center text-xs mt-2">No users in league</div>
          )}
        </ul>
      </div>
    </div>
  );
};
