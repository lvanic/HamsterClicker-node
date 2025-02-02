import { useUser } from "../hooks/useUser";
import { getLocalization } from "../localization/getLocalization";

export const LevelStatus = () => {
  const { user } = useUser();
  return (
    <div className="flex items-center gap-2">
      <img src="/img/friend-badge.png" className="w-8"/>
      <div className="flex flex-col justify-center text-[#F7B84B]">
        <div className="font-normal text-md uppercase">{getLevelTitle(user?.userLevel || 0)}</div>
        <div className="text-nowrap	text-xs font-light">
          Lvl {user?.userLevel}/{user?.maxLevel}
        </div>
      </div>
    </div>
  );
};

const getLevelTitle = (level: number) => {
  if (level >= 0 && level <= 10) return "Beginner";
  if (level >= 11 && level <= 20) return "Seeker";
  if (level >= 21 && level <= 30) return "Promising";
  if (level >= 31 && level <= 40) return "Determined";
  if (level >= 41 && level <= 50) return "Confident";
  if (level >= 51 && level <= 60) return "Expert";
  if (level >= 61 && level <= 70) return "Mentor";
  if (level >= 71 && level <= 80) return "Master";
  if (level >= 81 && level <= 90) return "Specialist";
  if (level >= 91 && level <= 100) return "Legend";
  return "Unknown";
};