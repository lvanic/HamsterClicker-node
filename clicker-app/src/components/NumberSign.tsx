import React, { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";

interface NumberSignProps {
  x: number;
  y: number;
  id: number;
  rewardPerClick: number;
  onAnimationEnd: (id: number) => void;
}

const NumberSign: React.FC<NumberSignProps> = ({
  x,
  y,
  id,
  rewardPerClick,
  onAnimationEnd,
}) => {
  const [opacity, setOpacity] = useState(1);
  const [signSize, setSignSize] = useState(Math.floor(Math.random() * 10) + 30);
  const [transform, setTransform] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const duration = 1000;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        onAnimationEnd(id);
      }
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [id, onAnimationEnd]);

  useEffect(() => {
    setOpacity(0);
    setTransform(-100);
  }, []);
  return (
    <div
      key={id}
      style={{
        position: "absolute",
        left: x - 10,
        top: y - 10,
        fontSize: signSize,
        color: "white",
        textShadow: "0 0 5px rgba(0, 0, 0, 0.5)",
        transform: `translateY(${transform}px)`,
        opacity: opacity,
        pointerEvents: "none",
        transition: "opacity 2s, transform 2s",
      }}
    >
      +{rewardPerClick}
    </div>
  );
};

export default NumberSign;
