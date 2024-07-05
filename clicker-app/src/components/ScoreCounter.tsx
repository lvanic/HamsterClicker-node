export const ScoreCounter = ({ clickCount }: { clickCount: number }) => {
  return (
    <div
      style={{
        marginBottom: "10px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        // fontFamily: "cursive",
      }}
    >
      <img src="./img/sisechka_coin.png" className="w-20 h-20" />
      <div
        style={{
          fontSize: "50px",
          color: "white",
          fontWeight: "600",
          paddingTop: "0px",
        }}
      >
        {clickCount}
      </div>
    </div>
  );
};
