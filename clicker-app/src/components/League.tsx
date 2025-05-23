import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { formatNumber } from "../utils/formatNumber";
import { getLocalization } from "../localization/getLocalization";

export const League = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  if (!user) {
    return <div />;
  }

  return (
    <div
      onClick={() => {
        navigate("/league");
      }}
      style={{ display: "flex", alignItems: "center" }}
      className="pb-6 w-full"
    >
      <div
        style={{
          height: "14px",
          width: "100%",
          backgroundColor: "#00000080",
        }}
        className="rounded-xl overflow-hidden"
      >
        <div
          style={{
            height: "100%",
            maxWidth: "100%",
            width: (user?.score / user?.league.maxScore) * 100 + "%",
            background: "linear-gradient(180deg, #FFCB83 46%, #FFAE4C 54.5%)",
          }}
          className="rounded-xl"
        />
        {/* <div className="text-xs mt-2 b-2 text-nowrap">
          {getLocalization("scoreForUp")} {formatNumber(user?.league.maxScore)}
        </div> */}
      </div>
    </div>
  );
};
