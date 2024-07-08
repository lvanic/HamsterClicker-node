import React, { useEffect, useState } from "react";
import { getConfig } from "../../../utils/config";
import { League } from "../../../models";
import { Link } from "react-router-dom";

const { adminApiUrl } = getConfig();

export const AdminLeagues = () => {
  const [leagues, setLeagues] = useState<League[]>([]);

  const refreshLeagues = async () => {
    const response = await fetch(`${adminApiUrl}/admin/leagues`);
    const data = await response.json();
    setLeagues(data);
  }

  useEffect(() => {
    refreshLeagues();
  }, []);

  const handleDeleteLeague = async (leagueId: string) => {
    if (window.confirm("Are you sure?")) {
      const response = await fetch(
        `${adminApiUrl}/admin/leagues/${leagueId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        refreshLeagues();
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <Link
        to="add"
        className="bg-green-600 hover:bg-green-700 text-white font-light py-1 px-4 w-full font-mono text-center"
      >
        ADD LEAGUE
      </Link>

      <div
        className="flex flex-col space-y-2"
        style={{ maxHeight: "80vh", overflow: "scroll" }}
      >
        {leagues.map((league) => (
          <div
            key={league.id}
            className="flex flex-row bg-slate-50 px-2 py-2 justify-between"
          >
            <img src={league.avatarUrl} className="w-10 h-10 rounded-full" />
            <div className="flex flex-col w-2/4">
              <div className="font-bold">{league.name}</div>
              <div className="text-xs font-light">{league.description}</div>
            </div>
            <button
              className="bg-red-200 px-4 w-1/4"
              onClick={() => handleDeleteLeague(league.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};