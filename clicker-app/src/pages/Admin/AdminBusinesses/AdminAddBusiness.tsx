import React, { useState } from "react";
import { getConfig } from "../../../utils/config";

const { adminApiUrl } = getConfig();

export const AdminAddBusiness = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [rewardPerHour, setRewardPerHour] = useState(0);
  const [refsToUnlock, setRefsToUnlock] = useState(0);
  const [price, setPrice] = useState(0);

  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async () => {
    const response = await fetch(`${adminApiUrl}/admin/businesses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        avatarUrl,
        rewardPerHour,
        refsToUnlock,
        price,
      }),
    });

    if (response.ok) {
      setIsError(false);
      setIsSuccess(true);
    } else {
      setIsSuccess(false);
      setIsError(true);
      setErrorText(await response.text());
    }
  };

  return (
    <div className="flex flex-col space-y-2 text-black">
      <input
        type="text"
        placeholder="Business name"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setName(e.target.value)}
      />

      <textarea
        placeholder="Description"
        className="bg-slate-50 py-1 px-4 w-full outline-none resize-none h-36"
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="text"
        placeholder="Avatar link"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setAvatarUrl(e.target.value)}
      />

      <input
        type="number"
        placeholder="Reward per hour"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setRewardPerHour(Number(e.target.value))}
      />

      <input
        type="number"
        placeholder="Refs to unlock"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setRefsToUnlock(Number(e.target.value))}
      />

      <input
        type="number"
        placeholder="Price"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setPrice(Number(e.target.value))}
      />

      <button
        className="bg-green-600 hover:bg-green-700 text-white font-light py-1 px-4 w-full font-mono"
        onClick={handleSubmit}
      >
        CONFIRM
      </button>

      {isSuccess && (
        <div className="bg-green-400 text-center text-white">
          Successfully added
        </div>
      )}
      {isError && (
        <div className="bg-red-600 text-center text-white">
          Error occurred. {errorText}
        </div>
      )}
    </div>
  );
};
