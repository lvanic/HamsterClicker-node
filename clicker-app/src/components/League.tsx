import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";

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
      className="ml-6 pb-6"
    >
      <div
        style={{
          height: "8px",
          width: "100%",
          backgroundColor: "#e0e0e0",
        }}
        className="rounded-xl"
      >
        <div
          style={{
            height: "100%",
            width: (user?.balance / user?.league.maxBalance) * 100 + "%",
            backgroundColor: "#FF5064",
          }}
          className="rounded-xl"
        />
        <div>Coins for UP {user?.league.maxBalance}</div>
      </div>
    </div>
  );
};
