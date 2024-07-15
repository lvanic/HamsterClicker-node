export const ScoreCounter = ({ clickCount }: { clickCount: number }) => {
  return (
    <div
      style={{
        marginBottom: "10px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <img src="./img/egg.png" className="h-12 mr-2" />
      <div
        style={{
          fontSize: "50px",
          color: "white",
          fontWeight: "600",
          paddingTop: "0px",
        }}
      >
        {Math.floor(clickCount)}
      </div>
    </div>
  );
};
