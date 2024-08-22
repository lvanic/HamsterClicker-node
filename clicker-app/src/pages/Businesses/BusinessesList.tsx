import { memo } from "react";
import { VerticalDivider } from "../../components/VerticalDivider";
import { Business, User } from "../../models";
import { formatNumber } from "../../utils/formatNumber";
import { EggSvg } from "../Layout/EggSvg";
import Timer from "./Timer";

export const BusinessesList = memo(function BusinessesList({
  businesses,
  user,
  setSelectedBusiness,
  setModalOpen,
}: {
  businesses: Business[];
  user: User;
  setSelectedBusiness: (arg0: Business) => void;
  setModalOpen: (arg0: boolean) => void;
}) {
  return (
    <>
      {businesses.map((business) => {
        const isAffordable = (user?.balance || 0) >= business.price;
        const isEnoughRefs =
          (user?.referrals.length || 0) >= business.refsToUnlock;
        const isLastUpgradeLessThanHourAgo =
          Date.now() - business.lastUpgradeTimestamp < 3600000;
        const isAvailable =
          isAffordable && isEnoughRefs && !isLastUpgradeLessThanHourAgo;

        return (
          <div
            key={business.id}
            className={`business-item relative ${
              !isAvailable ? "opacity-20 cursor-not-allowed" : "opacity-100"
            }`}
            onClick={() => {
              if (isAvailable) {
                setSelectedBusiness(business);
                setModalOpen(true);
              }
            }}
          >
            {!isAffordable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-center text-sm p-2 rounded-2xl rounded-b-xl">
                Not enough funds
              </div>
            )}
            {!isEnoughRefs && isAffordable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-center text-sm p-2 rounded-2xl rounded-b-xl">
                Not enough refs - {business.refsToUnlock}
              </div>
            )}
            {isLastUpgradeLessThanHourAgo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-center text-sm p-2 rounded-2xl rounded-b-xl">
                Upgrade locked for{" "}
                {/* {new Date(
                  business.lastUpgradeTimestamp + 3600000
                ).toLocaleTimeString()} */}
                <Timer
                  timestamp={
                    business.lastUpgradeTimestamp +
                    (business.level - 1 + 2) * 1000
                  }
                />
              </div>
            )}

            <div className="flex justify-left items-center p-2 pb-2">
              <img
                src={business.avatarUrl}
                className="rounded-full w-8 h-8 mr-2"
              />
              <div>
                <h3 style={{ fontSize: 10.2 }}>{business.name}</h3>
                <div style={{ fontSize: 8 }} className="mt-2">
                  Reward per hour:
                  <div className="text-sm">
                    {formatNumber(business.rewardPerHour)}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#5C5C5C] w-full h-10 rounded-xl flex items-center justify-between px-2">
              <div className="text-sm"> {business.level} lvl</div>
              <div>
                <VerticalDivider />
              </div>
              <div className="flex items-center">
                <EggSvg className="h-6" />
                <div className="ml-1 text-sm">
                  {formatNumber(business.price)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
});
