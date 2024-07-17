import { useUser } from "../hooks/useUser";
import { MediumEggSvg } from "../pages/Businesses/MediumEggSvg";
import { EggSvg } from "../pages/Layout/EggSvg";
import { SmallEggSvg } from "./SmallEggSvg";

export const Statistics = () => {
  const { user } = useUser();
  return (
    <div className="flex justify-center items-center">
      <div>
        <div>Profit per tap</div>
        <div className="flex flex-row justify-center items-center">
          <EggSvg />
          <div className="ml-2 text-xl">+{user?.clickPower}</div>
        </div>
      </div>
      <div>
        <div>Profit per hour</div>
        <div className="flex flex-row justify-center items-center ml-4">
          <EggSvg />
          <div className="ml-2 text-xl">+{user?.totalIncomePerHour}</div>
        </div>
      </div>
    </div>
  );
};
