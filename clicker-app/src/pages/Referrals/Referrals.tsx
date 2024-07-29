import React, { useState } from "react";
import { useUser } from "../../hooks/useUser";
import { ReferralLink } from "../../components/ReferralLink";
import { MediumEggSvg } from "../Businesses/MediumEggSvg";
import { EggSvg } from "../Layout/EggSvg";
import { LargerEggSvg } from "../Businesses/LargerEggSvg";
import { useSettings } from "../../hooks/useSettings";
import { Delimiter } from "./Delimiter";
import { Reloader } from "./Reloader";
import { useWebSocket } from "../../hooks/useWebsocket";

export const Referrals = () => {
  const { user, setUser } = useUser();
  const referrals = user?.referrals;
  const { referralReward } = useSettings();
  const { webSocket } = useWebSocket();
  const [isReferralUpdate, setReferralUpdate] = useState(false);

  const updateReferals = () => {
    setReferralUpdate(true);
    webSocket?.emit("getUser", user?.tgId);
    setTimeout(() => {
      setReferralUpdate(false);
    }, 3000);
  };

  return (
    <div className="font-sans p-12 rounded-lg max-w-md mx-auto">
      <div className="text-center text-xl">
        Invite friends and
        <br /> earn coins!
      </div>
      <div className="flex flex-col justify-center items-center bg-[#383838] rounded-xl mt-8 mb-8">
        <LargerEggSvg className="absolute mb-20" />
        <div className="mt-7 mb-7">1 friend = {referralReward} coins</div>
        <ReferralLink className="mt-20" />
      </div>
      <div className="flex flex-col justify-center items-center bg-[#383838] rounded-xl mt-14 mb-8">
        <LargerEggSvg className="absolute mb-24" />
        <div className="mt-7 text-sm underline underline-offset-2">
          If he has telegram premium
        </div>
        <div className="mb-7">1 friend = {referralReward} coins</div>
        <ReferralLink className="mt-24" />
      </div>
      <ul
        className="list-none p-4 rounded-xl bg-[#383838]"
        style={{ maxHeight: window.innerHeight - 476, overflowY: "scroll" }}
      >
        <div onClick={updateReferals} className="absolute right-0 mr-16">
          <Reloader className={isReferralUpdate ? "animate-spin" : ""} />
        </div>
        <div className="text-center mb-2">List of invited friends</div>

        {referrals?.length && referrals?.length > 0 ? (
          referrals?.map((referral, index) => (
            <>
              <li
                key={referral.tgId}
                className="pl-3 pt-1 pb-1 pr-0 my-1 rounded-md flex items-center shadow-sm"
              >
                <div className="flex text-md justify-center items-center border-2 border-white rounded-full w-10 h-10 mr-2">
                  {referral.firstName[0]}
                </div>
                <div className="flex flex-row">
                  <div className="text-xs">{referral.firstName}</div>
                  <div className="text-xs ml-2">@{referral.tgUsername}</div>
                </div>
              </li>
              <Delimiter />
            </>
          ))
        ) : (
          <div className="flex flex-col justify-center items-center">
            <div className="text-[#FD5463] text-xl">:(</div>
            <div className="text-xs mt-2">You don't have invited friends</div>
          </div>
        )}
      </ul>
    </div>
  );
};
