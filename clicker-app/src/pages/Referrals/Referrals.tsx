import React, { useEffect, useState } from "react";
import { useUser } from "../../hooks/useUser";
import { ReferralLink } from "../../components/ReferralLink";

import { getLocalization } from "../../localization/getLocalization";
import { getReferralLink } from "../../services/telegramService";

export const Referrals = () => {
  const { user, setUser } = useUser();
  const referrals = user?.referrals;

  const [link, setLink] = useState("");

  useEffect(() => {
    const fetchLink = async () => {
      const referralLink = await getReferralLink();
      setLink(referralLink);
    };

    fetchLink();
  }, []);
  return (
    <div className="px-4 rounded-lg max-w-md mx-auto">
      <div className="text-center text-3xl uppercase">
        {referrals?.length} {getLocalization("refferals")}
      </div>

      <div className=" justify-center overflow-hidden rounded-xl mt-8 relative px-3 py-4 pr-5">
        <img
          src="/img/invite-link-mask.png"
          className="absolute w-full h-full top-0 left-0 z-[-1]"
        />
        <div className="flex items-center justify-between">
          <div className="text-xl uppercase">{getLocalization("myLink")}</div>
          <ReferralLink className="" share={false} />
        </div>
        
        <div className="font-extralight">{link}</div>
      </div>
      <div className="w-full border-t border-[#FFBB96] my-6" />
      <ul
        className="list-none rounded-xl"
        style={{ maxHeight: window.innerHeight - 351, overflowY: "scroll" }}
      >
        {referrals?.length && referrals?.length > 0 ? (
          referrals?.map((referral, index) => (
            <li
              key={referral.tgId}
              className="pl-3 py-2 pr-0 my-1 rounded-md flex items-center shadow-sm w-full relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(57.26deg, #761B3F 0%, #78490D 100%)",
              }}
            >
              <img
                className="absolute w-full h-full left-0 top-0"
                src="/img/friend-mask.png"
              />
              {/* <div className="flex text-md justify-center items-center border-2 border-white rounded-full w-10 h-10 mr-2">
                {referral.firstName[0]}
              </div> */}
              <img
                src="/img/friend-badge.png"
                className="flex text-md justify-center items-center w-10 h-10 mr-2"
              />
              <div className="flex flex-row">
                <div className="text-xs">
                  {referral.firstName || "Anonimus"}
                </div>
                <div className="text-xs ml-2">
                  @{referral.tgUsername || "Anonimus"}
                </div>
              </div>
            </li>
          ))
        ) : (
          <div className="flex flex-col justify-center items-center">
            <div className="text-[#FFAE4C] text-xl">:(</div>
            <div className="text-xs mt-2">{getLocalization("noFriends")}</div>
          </div>
        )}
      </ul>
    </div>
  );
};
