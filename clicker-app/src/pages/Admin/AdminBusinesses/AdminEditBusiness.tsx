import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getConfig } from "../../../utils/config";

const { adminApiUrl } = getConfig();

export const AdminEditBusiness = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [rewardPerHour, setRewardPerHour] = useState(0);
  const [refsToUnlock, setRefsToUnlock] = useState(0);
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("Specials");

  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");

  const navigate = useNavigate();
  const { id } = useParams();

  const handleSubmit = async () => {
    const response = await fetch(`${adminApiUrl}/admin/businesses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Admin-Token": localStorage.getItem("password") || "",
      },
      body: JSON.stringify({
        name,
        description,
        avatarUrl,
        rewardPerHour,
        refsToUnlock,
        price,
        category,
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
        const response = await fetch(`${adminApiUrl}/admin/businesses/${id}`, {
          headers: { "Admin-Token": localStorage.getItem("password") || "" },
        });
        const business = await response.json();

        setName(business.name);
        setDescription(business.description);
        setAvatarUrl(business.avatarUrl);
        setRewardPerHour(business.rewardPerHour);
        setCategory(business.category);
        setRefsToUnlock(business.refsToUnlock);
        setPrice(business.price);
      } else {
        navigate("/admin/businesses");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col space-y-2 text-black">
      <div className="text-white">Business name</div>
      <input
        type="text"
        placeholder="Business name"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setName(e.target.value)}
        value={name}
      />
      <div className="text-white">Description</div>
      <textarea
        placeholder="Description"
        className="bg-slate-50 py-1 px-4 w-full outline-none resize-none h-36"
        onChange={(e) => setDescription(e.target.value)}
        value={description}
      />
      <select onChange={(e) => setCategory(e.target.value)}>
        <option value="PR&Team" selected={category == "PR&Team"}>
          PR&Team
        </option>
        <option value="Markets" selected={category == "Markets"}>
          Markets
        </option>
        <option value="Legal" selected={category == "Legal"}>
          Legal
        </option>
        <option value="Web3" selected={category == "Web3"}>
          Web3
        </option>
        <option value="Specials" selected={category == "Specials"}>
          Specials
        </option>
      </select>
      <div className="text-white">Avatar link</div>
      <input
        type="text"
        placeholder="Avatar link"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setAvatarUrl(e.target.value)}
        value={avatarUrl}
      />
      <div className="text-white">Reward per hour</div>
      <input
        type="number"
        placeholder="Reward per hour"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setRewardPerHour(Number(e.target.value))}
        value={rewardPerHour}
      />
      <div className="text-white">Refs to unlock</div>
      <input
        type="number"
        placeholder="Refs to unlock"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setRefsToUnlock(Number(e.target.value))}
        value={refsToUnlock}
      />
      <div className="text-white">Price</div>
      <input
        type="number"
        placeholder="Price"
        className="bg-slate-50 py-1 px-4 w-full outline-none"
        onChange={(e) => setPrice(Number(e.target.value))}
        value={price}
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
