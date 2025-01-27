import { useUser } from "../hooks/useUser";
import { getLocalization } from "../localization/getLocalization";
import { MediumEggSvg } from "../pages/Businesses/MediumEggSvg";
import { EggSvg } from "../pages/Layout/EggSvg";
import { formatNumber } from "../utils/formatNumber";
import { SmallEggSvg } from "./SmallEggSvg";

export const Statistics = () => {
  const { user } = useUser();

  return (
    <div className="flex w-full justify-around items-center">
      <div>
        <div className="text-sm">{getLocalization("profitPerTap")}</div>
        <div className="flex flex-row justify-center items-center">
          {/* <EggSvg /> */}
          <div className="ml-2 text-xl">+{user?.clickPower}</div>
        </div>
      </div>
      <div>
        <div className="text-sm">{getLocalization("profitPerHour")}</div>
        <div className="flex flex-row justify-center items-center">
          {/* <EggSvg /> */}
          <div className="ml-2 text-xl">
            +{formatNumber(user?.totalIncomePerHour || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};
