import { formatNumber } from "../utils/formatNumber";

export const ScoreCounter = ({ clickCount }: { clickCount: number }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      className="w-full"
    >
      <img src="./img/bag.png" className="h-9 mr-2" />
      <div
        style={{
          fontSize: "28px",
          color: "white",
          fontWeight: "600",
          paddingTop: "0px",
        }}
      >
        {formatNumber(Math.floor(clickCount))}
      </div>
    </div>
  );
};
