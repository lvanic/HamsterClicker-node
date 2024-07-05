import { useNavigate } from "react-router-dom";

export const League = () => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => {
        navigate("/league");
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span>Silver</span>
        <span style={{ marginLeft: "8px" }}>➡️</span>
        <span style={{ marginLeft: "8px" }}>Уровень 2/10</span>
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
          style={{ height: "100%", width: "50%", backgroundColor: "#ffd700" }}
        />
      </div>
    </div>
  );
};
