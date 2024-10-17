import React, { useEffect, useState } from "react";
import { getConfig } from "../../../utils/config";
import { User } from "../../../models";

const { adminApiUrl } = getConfig();

const TAKE = 10;

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [balanceSort, setBalanceSort] = useState<"asc" | "desc">("desc");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const refreshUsers = async () => {
    const skip = (page - 1) * TAKE;

    const response = await fetch(
      `${adminApiUrl}/admin/users?skip=${skip}&take=${TAKE}&balanceSort=${balanceSort}`,
      { headers: { "Admin-Token": localStorage.getItem("password") || "" } }
    );
    const data = await response.json();
    setUsers(data.data);
    setTotal(data.total);
  };

  useEffect(() => {
    refreshUsers();
  }, [page, balanceSort]);

  const onNextClick = () => {
    if (page < Math.ceil(total / TAKE)) {
      setPage(page + 1);
    }
  };

  const onPrevClick = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const onSortClick = () => {
    setBalanceSort(balanceSort === "asc" ? "desc" : "asc");
  };

  const copyToClipboard = (walletAddress: string) => {
    navigator.clipboard
      .writeText(walletAddress)
      .then(() => {
        alert("Кошелек скопирован в буфер обмена!");
      })
      .catch((err) => {
        console.error("Ошибка при копировании: ", err);
      });
  };

  return (
    <div className="flex flex-col space-y-4 p-6 bg-gray-100 rounded-lg shadow-lg text-black">
      <div className="flex flex-row items-start justify-between">
        <button
          className="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded"
          onClick={onSortClick}
        >
          Balance sort: {balanceSort === "asc" ? "asc" : "desc"}
        </button>

        <div className="flex flex-row items-center space-x-2">
          <button
            className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-black font-bold rounded"
            onClick={onPrevClick}
          >
            Prev
          </button>

          <span className="py-2 px-4 text-black font-mono">
            {(page - 1) * TAKE + 1} - {(page - 1) * TAKE + users.length}
          </span>

          <button
            className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-black font-bold rounded"
            onClick={onNextClick}
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex flex-col space-y-2 overflow-scroll max-h-[70vh]">
        {users.map((user, index) => (
          <div
            className="flex flex-row items-center bg-white py-2 px-4 shadow rounded"
            key={user.tgId}
          >
            <div className="w-1/5">
              <label className="font-bold">
                {index + 1 + (page - 1) * TAKE}
              </label>
            </div>

            <div className="w-2/5">
              <label className="font-bold">{user.tgUsername}</label>
              <label className="text-xs">{user.tgId}</label>
            </div>

            <div className="flex flex-col justify-items-start w-1/5">
              <div className="text-xs">balance: {user.balance}</div>
              <div className="text-xs">refs: {user.referrals.length}</div>
            </div>

            {user.connectedWallet && (
              <div className="flex items-center w-1/5">
                <span className="px-2 text-xs">
                  wallet: {user.connectedWallet}
                </span>
                <button
                  onClick={() => copyToClipboard(user.connectedWallet)}
                  className="ml-2 p-1 bg-blue-500 hover:bg-blue-600 rounded"
                  title="Копировать кошелек"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="white"
                    className="bi bi-clipboard"
                    viewBox="0 0 16 16"
                  >
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h9V.5a.5.5 0 0 1 1 0V1h.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H1a.5.5 0 0 1-.5-.5V1a.5.5 0 0 1 .5-.5h1V0h1.5zm0 1h9v1H3.5V1zM2 2v12h12V2H2z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
