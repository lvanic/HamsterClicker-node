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
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span>{user?.league.name}</span>
        <span style={{ marginLeft: "8px" }}>➡️</span>
        {/* <span style={{ marginLeft: "8px" }}>Level {user?.balance / user?.league.maxBalance }</span> */}
      </div>
      <div
        style={{
          height: "8px",
          width: "100%",
          backgroundColor: "#e0e0e0",
          marginTop: "8px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: (user?.league.maxBalance / user?.balance) * 10,
            backgroundColor: "#ffd700",
          }}
        />
      </div>
    </div>
  );
};
