import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { formatNumber } from "../utils/formatNumber";

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
          height: "5px",
          width: "100%",
          backgroundColor: "#e0e0e0",
        }}
        className="rounded-xl"
      >
        <div
          style={{
            height: "100%",
            maxWidth: "100%",
            width: (user?.score / user?.league.maxScore) * 100 + "%",
            backgroundColor: "#FF5064",
          }}
          className="rounded-xl"
        />
        <div className="text-xs mt-2">
          Score for UP {formatNumber(user?.league.maxScore)}
        </div>
      </div>
    </div>
  );
};
