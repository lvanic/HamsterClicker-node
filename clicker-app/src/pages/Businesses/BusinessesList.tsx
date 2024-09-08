import { memo } from "react";
import { VerticalDivider } from "../../components/VerticalDivider";
import { Business, User } from "../../models";
import { formatNumber } from "../../utils/formatNumber";
import { EggSvg } from "../Layout/EggSvg";
import Timer from "./Timer";
import { SmallEggSvg } from "../../components/SmallEggSvg";

export const BusinessesList = memo(function BusinessesList({
  businesses,
  user,
  setSelectedBusiness,
  setModalOpen,
  loadingBusinessIds,
}: {
  businesses: Business[];
  user: User;
  setSelectedBusiness: (arg0: Business) => void;
  setModalOpen: (arg0: boolean) => void;
  loadingBusinessIds: string[];
}) {
  return (
    <>
      {businesses.map((business) => {
        const isLoading = loadingBusinessIds.includes(business.id);
        const isAffordable = (user?.balance || 0) >= business.price;
        const isEnoughRefs =
          (user?.referrals.length || 0) >= business.refsToUnlock;
        const isLastUpgradeLessThanHourAgo =
          Date.now() - business.lastUpgradeTimestamp <
          5 * 1.6 ** (business.level - 3) * 1000 * 60;
        const isAvailable =
          isAffordable &&
          isEnoughRefs &&
          !isLastUpgradeLessThanHourAgo &&
          business.level < 10;

        return (
          <div
            key={business.id}
            className={`business-item relative ${
              !isAvailable ? "opacity-20 cursor-not-allowed" : "opacity-100"
            }`}
            onClick={() => {
              if (isAvailable && !isLoading) {
                setSelectedBusiness(business);
                setModalOpen(true);
              }
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white text-center rounded-2xl">
                <div className="loader"></div>
              </div>
            )}
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
                    5 * 1.6 ** (business.level - 3) * 1000 * 60
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
                  <div className="text-sm flex flex-col items-start">
                    <div className="text-xs text-left">
                      {formatNumber(business.rewardPerHour)}
                    </div>
                    <div className="text-green-500" style={{ fontSize: 10 }}>
                      (+
                      {formatNumber(
                        business.level == 0
                          ? business.rewardPerHour
                          : business.addedRewardPerHour
                      )}
                      )
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#5C5C5C] w-full h-10 rounded-xl flex items-center justify-between px-2">
              <div className="text-sm">
                {business.level < 10 ? business.level : "MAX"} lvl
              </div>
              <div>
                <VerticalDivider />
              </div>
              <div className="flex items-center">
                <SmallEggSvg />
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
