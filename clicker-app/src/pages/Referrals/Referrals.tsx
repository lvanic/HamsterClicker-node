import React from "react";
import { useUser } from "../../hooks/useUser";
import { ReferralLink } from "../../components/ReferralLink";

export const Referrals = () => {
  const { user, setUser } = useUser();
  const referrals = user?.referrals;

  return (
    <div className="font-sans p-5 rounded-lg max-w-md mx-auto shadow-md">
      <ReferralLink />
      <ul
        className="list-none p-0"
        style={{ maxHeight: window.innerHeight - 104, overflowY: "scroll" }}
      >
        {referrals?.map((referral, index) => (
          <li
            key={referral.tgId}
            className="p-3 my-2 bg-white bg-opacity-20 rounded-md flex items-center shadow-sm"
          >
            <img
              src={referral.avatarUrl}
              alt={referral.firstName}
              className="rounded-full w-12 h-12 mr-3"
            />
            <div className="text-white flex-1">
              <div className="font-bold">{referral.firstName}</div>
              <div className="text-gray-300">{referral.tgUsername}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
