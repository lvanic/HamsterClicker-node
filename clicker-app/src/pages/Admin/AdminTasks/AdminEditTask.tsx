import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getConfig } from "../../../utils/config";

const { adminApiUrl } = getConfig();

export const AdminEditTask = () => {
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
  const [errorText, setErrorText] = useState("");

  const navigate = useNavigate();
  const { id } = useParams();

  const handleSubmit = async () => {
    const response = await fetch(`${adminApiUrl}/admin/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Admin-Token": localStorage.getItem("password") || "",
      },
      body: JSON.stringify({
        name,
        description,
        avatarUrl,
        activateUrl,
        type,
        rewardAmount,
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

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const response = await fetch(`${adminApiUrl}/admin/tasks/${id}`, {
          headers: {
            "Admin-Token": localStorage.getItem("password") || "",
          },
        });
        const task = await response.json();

        setName(task.name);
        setDescription(task.description);
        setAvatarUrl(task.avatarUrl);
        setType(task.type);
        setActivateUrl(task.activateUrl);
        setRewardAmount(task.rewardAmount);
      } else {
        navigate("/admin/leagues");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col space-y-2 text-black">
      <input
        type="text"
        placeholder="Task name"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setName(e.target.value)}
        value={name}
      />

      <select
        name="choice"
        className="bg-slate-50 py-1 px-3 w-full outline-none"
        onChange={(e) =>
          setType(e.target.value.toString() as "telegram" | "link")
        }
        value={type}
      >
        <option value="telegram" selected>
          Telegram subscribe
        </option>
        <option value="link">Link navigation</option>
        <option value="twitter-subscribe">Twitter subscribe</option>
      </select>

      <input
        type="text"
        placeholder="Link"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setActivateUrl(e.target.value)}
        value={activateUrl}
      />

      <textarea
        placeholder="Description"
        className="bg-slate-50 py-1 px-4 w-full outline-none resize-none h-36"
        onChange={(e) => setDescription(e.target.value)}
        value={description}
      />

      <input
        type="text"
        placeholder="Avatar link"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setAvatarUrl(e.target.value)}
        value={avatarUrl}
      />

      <input
        type="number"
        placeholder="Reward amount"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setRewardAmount(Number(e.target.value))}
        value={rewardAmount}
      />

      <button
        className="bg-green-600 hover:bg-green-700 text-black font-light py-1 px-4 w-full font-mono"
        onClick={handleSubmit}
      >
        UPDATE
      </button>

      {isSuccess && (
        <div className="bg-green-400 text-center text-black">
          Successfully updated
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
