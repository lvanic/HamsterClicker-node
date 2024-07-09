import React, { useState } from "react";
import { getConfig } from "../../../utils/config";

const { adminApiUrl } = getConfig();

export const AdminAddLeague = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [minBalance, setMinBalance] = useState(0);
  const [maxBalance, setMaxBalance] = useState(0);

  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async () => {
    const response = await fetch(`${adminApiUrl}/admin/leagues`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        avatarUrl,
        minBalance,
        maxBalance,
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
  }

  return (
    <div className="flex flex-col space-y-2">
      <input
        type="text"
        placeholder="League name"
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
        placeholder="Min balance"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setMinBalance(Number(e.target.value))}
      />

      <input
        type="number"
        placeholder="Max balance"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setMaxBalance(Number(e.target.value))}
      />

      <button className="bg-green-600 hover:bg-green-700 text-white font-light py-1 px-4 w-full font-mono" onClick={handleSubmit}>
        CONFIRM
      </button>

      {isSuccess && <div className="bg-green-400 text-center text-white">Successfully added</div>}
      {isError && <div className="bg-red-600 text-center text-white">Error occurred. {errorText}</div>}
    </div>
  );
};