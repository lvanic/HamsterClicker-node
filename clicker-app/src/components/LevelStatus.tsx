import { useUser } from "../hooks/useUser";

export const LevelStatus = () => {
  const { user } = useUser();
  return (
    <div className="flex flex-col justify-center items-center w-1/2">
      <div className="text-nowrap	">
        Lvl {user?.userLevel}/{user?.maxLevel}
      </div>
      <div className="text-xs">Levels</div>
    </div>
  );
};
