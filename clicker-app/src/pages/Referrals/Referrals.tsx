import React from "react";
import { useUser } from "../../hooks/useUser";
import { ReferralLink } from "../../components/ReferralLink";
import { MediumEggSvg } from "../Businesses/MediumEggSvg";
import { EggSvg } from "../Layout/EggSvg";
import { LargerEggSvg } from "../Businesses/LargerEggSvg";
import { useSettings } from "../../hooks/useSettings";

export const Referrals = () => {
  const { user, setUser } = useUser();
  const referrals = user?.referrals;
  const { referralReward } = useSettings();
  console.log(referrals);
  
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
        style={{ maxHeight: window.innerHeight - 344, overflowY: "scroll" }}
      >
        <div>List of invited friends</div>
        {referrals?.map((referral, index) => (
          <li
            key={referral.tgId}
            className="p-3 my-2 rounded-md flex items-center shadow-sm"
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
