import React from "react";

export const LeagueTop = () => {
  return (
    <div className="font-sans p-5 rounded-lg max-w-md mx-auto shadow-md">
      <h2 className="text-2xl font-bold mb-4">Top League</h2>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th className="py-2 px-4 text-left">Rank</th>
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {/* Placeholder data */}
          <tr className="bg-white hover:bg-gray-100 transition-colors">
            <td className="py-2 px-4">1</td>
            <td className="py-2 px-4">Team A</td>
            <td className="py-2 px-4 text-right">100</td>
          </tr>
          <tr className="bg-white hover:bg-gray-100 transition-colors">
            <td className="py-2 px-4">2</td>
            <td className="py-2 px-4">Team B</td>
            <td className="py-2 px-4 text-right">90</td>
          </tr>
          <tr className="bg-white hover:bg-gray-100 transition-colors">
            <td className="py-2 px-4">3</td>
            <td className="py-2 px-4">Team C</td>
            <td className="py-2 px-4 text-right">80</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
