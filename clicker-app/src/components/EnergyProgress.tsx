export const EnergyProgress = ({ energyCount }: { energyCount: number }) => {
  return (
    <div style={{ width: "100%", display: "flex", alignItems: "center" }}>
      <div
        style={{
          fontSize: "23px",
          marginRight: "1rem",
          marginLeft: "1rem",
          color: "rgb(246, 143, 50)",
          fontWeight: "600",
          // fontFamily: "cursive",
        }}
      >
        {energyCount}
      </div>
      <div
        style={{
          width: "100%",
          height: "20px",
          backgroundColor: "#ddd",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${energyCount / 10}%`,
            height: "100%",
            backgroundColor: "#f68f32",
            transition: "width 0.3s ease-out",
          }}
        ></div>
      </div>
    </div>
  );
};
