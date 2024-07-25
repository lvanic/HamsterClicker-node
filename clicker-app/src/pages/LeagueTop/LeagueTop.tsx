import React, { useState, useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { useWebSocket } from "../../hooks/useWebsocket";
import { League, User } from "../../models";

export const LeagueTop = () => {
  const { user } = useUser();
  const { webSocket } = useWebSocket();
  const [league, setLeague] = useState<League | null>(null);
  const [usersInLeague, setUsersInLeague] = useState(0);
  const [topUsersInLeague, setTopUsersInLeague] = useState<User[]>([]);

  useEffect(() => {
    if (webSocket) {
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
    <div className="font-sans p-5 rounded-lg max-w-md mx-auto shadow-md bg-[#2D3748] text-white">
      <h2 className="text-2xl font-bold mb-4">
        {league ? league.name : "Top League"}
      </h2>
      <p>{league ? league.description : "Loading league information..."}</p>
      <p className="my-2">Total users in league: {usersInLeague}</p>
      <table className="w-full mt-4">
        <thead>
          <tr className="bg-[#434A54] text-gray-300">
            <th className="py-2 px-4 text-left">Rank</th>
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {topUsersInLeague.length > 0 ? (
            topUsersInLeague.map((user: User, index: number) => (
              <tr
                key={user.tgId}
                className="bg-[#3C4858] hover:bg-[#434A54] transition-colors"
              >
                <td className="py-2 px-4">{index + 1}</td>
                <td className="py-2 px-4">
                  {user.tgUsername || user.firstName}
                </td>
                <td className="py-2 px-4 text-right">{user.balance}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="py-2 px-4 text-center">
                No users in league
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
 