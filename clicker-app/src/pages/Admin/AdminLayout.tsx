import React from "react";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = window.location;

  return (
    <div className="font-sans p-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-4 font-mono">CLICKER ADMIN</h1>
      <ul className="list-none list-inside flex flex-row justify-between mb-6">
        <li className="py-1 px-6 bg-slate-50 font-bold">
          <a
            className={pathname === "/admin/tasks" ? "text-black" : "text-gray-400"}
            href="/admin/tasks"
          >
            Tasks
          </a>
        </li>
        <li className="py-1 px-10 bg-slate-50 font-bold">
          <a
            className={pathname === "/admin/leagues" ? "text-black" : "text-gray-400"}
            href="/admin/leagues"
          >
            Leagues
          </a>
        </li>
        <li className="py-1 px-10 bg-slate-50 font-bold">
          <a
            className={pathname === "/admin/businesses" ? "text-black" : "text-gray-400"}
            href="/admin/businesses"
          >
            Businesses
          </a>
        </li>
        <li className="py-1 px-10 bg-slate-50 font-bold">
          <a
            className={pathname === "/admin/users" ? "text-black" : "text-gray-400"}
            href="/admin/users"
          >
            Users
          </a>
        </li>
        <li className="py-1 px-10 bg-slate-50 font-bold">
          <a
            className={pathname === "/admin/settings" ? "text-black" : "text-gray-400"}
            href="/admin/settings"
          >
            Settings
          </a>
        </li>
      </ul>
      {children}
    </div>
  );
};