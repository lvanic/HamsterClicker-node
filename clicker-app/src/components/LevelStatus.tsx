import { useUser } from "../hooks/useUser";
import { getLocalization } from "../localization/getLocalization";

export const LevelStatus = () => {
  const { user } = useUser();
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="text-nowrap	">
        Lvl {user?.userLevel}/{user?.maxLevel}
      </div>
      <div className="text-xs font-light">{getLocalization("levels")}</div>
    </div>
  );
};
