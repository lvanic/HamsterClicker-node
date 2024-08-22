import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { getConfig } from "../../../utils/config";

const { adminApiUrl } = getConfig();

export const AdminEditLeague = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");

  const navigate = useNavigate();
  const { id } = useParams();

  const handleSubmit = async () => {
    const response = await fetch(`${adminApiUrl}/admin/leagues/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        avatarUrl,
        minScore,
        maxScore,
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

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const response = await fetch(`${adminApiUrl}/admin/leagues/${id}`);
        const league = await response.json();

        setName(league.name);
        setDescription(league.description);
        setAvatarUrl(league.avatarUrl);
        setMinScore(league.minScore);
        setMaxScore(league.maxScore);
      } else {
        navigate("/admin/leagues");
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col space-y-2 text-black">
      <input
        type="text"
        placeholder="Business name"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setName(e.target.value)}
        value={name}
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
        placeholder="Min balance"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setMinScore(Number(e.target.value))}
        value={minScore}
      />

      <input
        type="number"
        placeholder="Max balance"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setMaxScore(Number(e.target.value))}
        value={maxScore}
      />

      <button className="bg-green-600 hover:bg-green-700 text-black font-light py-1 px-4 w-full font-mono" onClick={handleSubmit}>
        UPDATE
      </button>

      {isSuccess && <div className="bg-green-400 text-center text-black">Successfully updated</div>}
      {isError && <div className="bg-red-600 text-center text-white">Error occurred. {errorText}</div>}
    </div>
  );
};