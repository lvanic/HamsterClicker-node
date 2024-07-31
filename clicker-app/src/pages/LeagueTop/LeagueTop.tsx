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
      webSocket.emit("getLeagueInfo", user?.league.id, 10);

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

  return (
    <div className="font-sans p-12 rounded-lg max-w-md mx-auto text-white shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {league ? league.name : "Top League"}
      </h2>
      <p className="text-center">
        {league ? league.description : "Loading league information..."}
      </p>
      <p className="my-2 text-center">Total users in league: {usersInLeague}</p>
      <div className="flex flex-col justify-center items-center bg-[#383838] rounded-xl mt-8 mb-8 p-4">
        <div className="text-center mb-2">Top Users in League</div>
        <ul className="list-none w-full">
          {topUsersInLeague.length > 0 ? (
            topUsersInLeague.map((user: User, index: number) => (
              <li
                key={user.tgId}
                className="flex justify-between items-center bg-[#3C4858] rounded-md p-4 my-1 shadow-sm"
              >
                <div className="flex items-center">
                  <div className="flex text-md justify-center items-center border-2 border-white rounded-full w-10 h-10 mr-2">
                    {index + 1}
                  </div>
                  <div>{user.tgUsername || user.firstName}</div>
                </div>
                <div> {formatNumber(user.score)}</div>
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
