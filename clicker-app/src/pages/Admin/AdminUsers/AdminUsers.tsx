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

    const response = await fetch(`${adminApiUrl}/admin/users?skip=${skip}&take=${TAKE}&balanceSort=${balanceSort}`);
    const data = await response.json();
    setUsers(data.data);
    setTotal(data.total);
}

  useEffect(() => {
    refreshUsers();
  }, [page, balanceSort]);

  const onNextClick = () => {
    if (page < Math.ceil(total / TAKE)) {
      setPage(page + 1);
    }
  }

  const onPrevClick = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  const onSortClick = () => {
    if (balanceSort === "asc") {
      setBalanceSort("desc");
    } else {
      setBalanceSort("asc");
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-row items-start justify-between">
        <button className="py-2 px-4 bg-slate-50 hover:bg-slate-300 font-mono text-sm" onClick={onSortClick}>
          Balance sort: {balanceSort === "asc" ? "asc" : "desc"}
        </button>

        <div className="flex flex-row items-center space-x-2">
          <button className="py-2 px-4 bg-slate-50 hover:bg-slate-300 font-mono text-sm" onClick={onPrevClick}>
            Prev
          </button>

          <span className="py-2 px-4 bg-slate-50 font-mono text-sm">
            {(page - 1) * TAKE + 1} - {(page - 1) * TAKE + users.length}
          </span>

          <button className="py-2 px-4 bg-slate-50 hover:bg-slate-300 font-mono text-sm" onClick={onNextClick}>
            Next
          </button>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        {users.map((user, index) => (
          <div className="flex flex-row items-center bg-slate-50 py-2 px-4" key={user.tgId}>
            <div className="flex flex-col justify-items-start w-2/5">
              <label className="font-bold">{(index + 1) + (page - 1) * TAKE}</label>
            </div>

            <div className="flex flex-col justify-items-start w-2/5">
              <label className="font-bold">{user.tgUsername}</label>
              <label className="text-xs">{user.tgId}</label>
            </div>

            <div className="flex flex-col justify-items-start">
              <div className="text-xs">balance: {user.balance}</div>
              <div className="text-xs">refs: {user.referrals.length}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
