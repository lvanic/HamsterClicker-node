import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../contexts/UserContext";

const Timer = ({ timestamp }: { timestamp: number }) => {
  const [timeRemaining, setTimeRemaining] = useState<any>(null);
  const user = useContext(UserContext);
  useEffect(() => {
    const currentTime = new Date().getTime();
    const remainingTime = timestamp - currentTime;

    if (remainingTime <= 0) {
      setTimeRemaining(null);
    } else {
      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      );
    }
  }, [timestamp, user]);

  return <div>{timeRemaining ? timeRemaining : "Время вышло"}</div>;
};

export default Timer;
