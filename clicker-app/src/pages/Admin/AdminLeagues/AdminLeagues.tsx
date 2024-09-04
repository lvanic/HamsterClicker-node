import React, { useEffect, useState } from "react";
import { getConfig } from "../../../utils/config";
import { League } from "../../../models";
import { Link, useNavigate } from "react-router-dom";

const { adminApiUrl } = getConfig();

export const AdminLeagues = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const navigate = useNavigate();

  const refreshLeagues = async () => {
    const response = await fetch(`${adminApiUrl}/admin/leagues`, {
      headers: { "Admin-Token": localStorage.getItem("password") || "" },
    });
    const data = await response.json();
    setLeagues(data);
  };

  useEffect(() => {
    refreshLeagues();
  }, []);

  const handleDeleteLeague = async (leagueId: string) => {
    if (window.confirm("Are you sure?")) {
      const response = await fetch(`${adminApiUrl}/admin/leagues/${leagueId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Admin-Token": localStorage.getItem("password") || "",
        },
      });

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

      <div className="flex flex-col space-y-2 overflow-scroll max-h-[70vh]">
        {leagues.map((league) => (
          <div
            key={league.id}
            className="flex flex-row bg-slate-50 px-2 py-2 justify-between text-black"
          >
            <img src={league.avatarUrl} className="w-10 h-10 rounded-full" />
            <div className="flex flex-col w-2/4">
              <div className="font-bold">{league.name}</div>
              <div className="text-xs font-light">{league.description}</div>
            </div>

            <div className="flex space-x-1">
              <button
                className="bg-green-200 px-2"
                onClick={() => navigate("/admin/leagues/edit/" + league.id)}
              >
                Edit
              </button>

              <button
                className="bg-red-300 px-4"
                onClick={() => handleDeleteLeague(league.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
