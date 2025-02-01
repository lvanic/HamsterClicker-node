import { useSettings } from "../hooks/useSettings";

export const EnergyProgress = ({
  energyCount,
  maxEnergy,
}: {
  energyCount: number;
  maxEnergy: number | undefined;
}) => {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      className="mt-2"
    >
      <div className=" bg-[#7437B9BD] flex p-2 rounded-2xl items-center content-center justify-center text-black">
       <img className="h-[26px]" src="/img/lightning.png"/>
        <div
          className="ml-2 text-white font-bold text-xl"
        >
          {energyCount}/{maxEnergy || 1000}
        </div>
      </div>
    </div>
  );
};
