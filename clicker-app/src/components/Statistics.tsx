import { useUser } from "../hooks/useUser";
import { MediumEggSvg } from "../pages/Businesses/MediumEggSvg";
import { EggSvg } from "../pages/Layout/EggSvg";
import { formatNumber } from "../utils/formatNumber";
import { SmallEggSvg } from "./SmallEggSvg";

export const Statistics = () => {
  const { user } = useUser();

  return (
    <div className="flex w-full justify-around items-center">
      <div>
        <div className="text-sm">Profit per tap</div>
        <div className="flex flex-row justify-end items-center">
          <EggSvg />
          <div className="ml-2 text-xl">+{user?.clickPower}</div>
        </div>
      </div>
      <div>
        <div className="text-sm">Profit per hour</div>
        <div className="flex flex-row justify-start items-center">
          <EggSvg />
          <div className="ml-2 text-xl">
            +{formatNumber(user?.totalIncomePerHour || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};
