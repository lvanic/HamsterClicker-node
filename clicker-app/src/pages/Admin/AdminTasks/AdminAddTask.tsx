import React, { useState } from "react";
import { getConfig } from "../../../utils/config";

const { adminApiUrl } = getConfig();

export const AddTask = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"telegram" | "link" | "twitter-subscribe">(
    "telegram"
  );
  const [activateUrl, setActivateUrl] = useState("");
  const [description, setDescription] = useState("");
  const [rewardAmount, setRewardAmount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");

  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    const response = await fetch(`${adminApiUrl}/admin/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Admin-Token": localStorage.getItem("password") || "",
      },
      body: JSON.stringify({
        name,
        type,
        activateUrl,
        description,
        rewardAmount,
        avatarUrl,
      }),
    });

    if (response.ok) {
      setIsError(false);
      setIsSuccess(true);
    } else {
      setIsSuccess(false);
      setIsError(true);
    }
  };

  return (
    <div className="flex flex-col space-y-2 text-black">
      <input
        type="text"
        placeholder="Task name"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setName(e.target.value)}
      />

      <select
        name="choice"
        className="bg-slate-50 py-1 px-3 w-full outline-none"
        onChange={(e) =>
          setType(e.target.value.toString() as "telegram" | "link")
        }
      >
        <option value="telegram" selected>
          Telegram subscribe
        </option>
        <option value="link">Link navigation</option>
        {/* <option value="twitter-subscribe">Twitter subscribe</option> */}
      </select>

      <input
        type="text"
        placeholder="Link"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setActivateUrl(e.target.value)}
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
        placeholder="Reward amount"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setRewardAmount(Number(e.target.value))}
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
        <div className="bg-red-600 text-center text-white">Error occurred</div>
      )}
    </div>
  );
};
