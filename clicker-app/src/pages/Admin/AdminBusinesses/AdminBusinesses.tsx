import React, { useEffect, useState } from "react";
import { getConfig } from "../../../utils/config";
import { Business } from "../../../models";
import { Link, useNavigate } from "react-router-dom";

const { adminApiUrl } = getConfig();

export const AdminBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const navigate = useNavigate();

  const refreshBusinesses = async () => {
    const response = await fetch(`${adminApiUrl}/admin/businesses`, {
      headers: { "Admin-Token": localStorage.getItem("password") || "" },
    });
    const data = await response.json();
    setBusinesses(data);
  };

  useEffect(() => {
    refreshBusinesses();
  }, []);

  const handleRemoveBusiness = async (businessId: string) => {
    if (window.confirm("Are you sure?")) {
      const response = await fetch(
        `${adminApiUrl}/admin/businesses/${businessId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Admin-Token": localStorage.getItem("password") || "",
          },
        }
      );

      if (response.ok) {
        refreshBusinesses();
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <Link
        to="add"
        className="bg-green-600 hover:bg-green-700 text-white font-light py-1 px-4 w-full font-mono text-center"
      >
        ADD BUSINESS
      </Link>

      <div className="flex flex-col space-y-2 overflow-y-hidden max-h-[80vh]">
        {businesses.map((business) => (
          <div
            key={business.id}
            className="flex flex-row bg-slate-50 px-2 py-2 justify-between text-black"
          >
            <img src={business.avatarUrl} className="w-10 h-10 rounded-full" />
            <div className="flex flex-col w-3/4">
              <div className="flex space-x-2">
                <span className="font-bold w-1/4">{business.name}</span>
                <span className="text-xs text-green-800 w-1/4">
                  Price: {business.price}
                </span>
                <span className="text-xs w-1/4">
                  ({business.rewardPerHour} coins / hour)
                </span>
                {business.refsToUnlock > 0 && (
                  <span className="text-xs align-middle text-indigo-700 w-1/4">
                    {business.refsToUnlock} refs to unlock
                  </span>
                )}
              </div>
              <div className="text-xs font-light">{business.description}</div>
            </div>

            <div className="flex space-x-1">
              <button
                className="bg-green-200 px-2"
                onClick={() =>
                  navigate("/admin/businesses/edit/" + business.id)
                }
              >
                Edit
              </button>

              <button
                className="bg-red-200 px-2"
                onClick={() => handleRemoveBusiness(business.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
