import React, { useState, useEffect, useRef, memo } from "react";
import { useClick } from "../../hooks/useClick";
import NumberSign from "../../components/NumberSign";
import { EnergyProgress } from "../../components/EnergyProgress";
import { ScoreCounter } from "../../components/ScoreCounter";
import TonButton from "../../components/TonButton/TonButton";
import { useUser } from "../../hooks/useUser";
import { usePageLoading } from "../../hooks/usePageLoading";
import { useSkeletonLoading } from "../../hooks/useSkeletonLoading";
import { ClickerSkeleton } from "./ClickerSkeleton";
import { League } from "../../components/League";
import { BoostButton } from "../../components/BoostButton";
import "./Clicker.css"; // Создайте и импортируйте CSS файл

export const Clicker: React.FC = () => {
  const { handleClick, clickCount, energyCount } = useClick();
  const imgRef = useRef<HTMLImageElement>(null);

  const [numberSignPositions, setNumberSignPositions] = useState<
    { x: number; y: number; id: number }[]
  >([]);
  const [numberSignId, setNumberSignId] = useState<number>(0);
  const [activeTouches, setActiveTouches] = useState<Set<number>>(new Set());
  const [imageClicked, setImageClicked] = useState<boolean>(false);
  const { user } = useUser();
  const isSkeletonLoading = useSkeletonLoading();

  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault();
    const newTouches = new Set<number>(
      Array.from(event.touches, (touch) => touch.identifier)
    );
    const newTouchIdentifiers = Array.from(newTouches).filter(
      (identifier) => !activeTouches.has(identifier)
    );

    if (newTouchIdentifiers.length > 0) {
      const touchPositions = Array.from(event.touches)
        .filter((touch) => newTouchIdentifiers.includes(touch.identifier))
        .map((touch, index) => ({
          x: touch.clientX,
          y: touch.clientY,
          id: numberSignId + index + 1,
          timestamp: Date.now(),
        }));

      if (energyCount > 0) {
        setNumberSignId((prevId) => prevId + touchPositions.length);

        setImageClicked(true);
        setTimeout(() => setImageClicked(false), 50);

        setNumberSignPositions((prevPositions) => [
          ...prevPositions,
          ...touchPositions,
        ]);
      }

      touchPositions.forEach((position) => {
        if (user) {
          handleClick({
            user_id: user.tgId,
            position: { x: position.x, y: position.y },
            time_stamp: Date.now(),
          });
        }
      });

      setActiveTouches(newTouches);
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    event.preventDefault();
  };

  const handleTouchEnd = (event: TouchEvent) => {
    event.preventDefault();
    const remainingTouches = new Set<number>(
      Array.from(event.touches, (touch) => touch.identifier)
    );
    setActiveTouches(remainingTouches);
  };

  const handleAnimationEnd = (id: number) => {
    setNumberSignPositions((prevPositions) =>
      prevPositions.filter((position) => position.id !== id)
    );
  };

  const handleContextMenu = (
    event: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    event.preventDefault(); // Prevent default context menu
  };

  const handleClickEvent = () => {
    if (user) {
      handleClick({
        user_id: user.tgId,
        position: { x: 100, y: 200 },
        time_stamp: Date.now(),
      });
    }
  };

  return (
    <div
      className="text-center p-4 relative flex flex-col items-center"
      onScroll={(e) => e.preventDefault()}
    >
      {isSkeletonLoading ? (
        <ClickerSkeleton />
      ) : (
        <>
          <BoostButton />
          <div className="flex flex-row justify-center items-center w-full mb-4">
            <ScoreCounter clickCount={clickCount} />
            <League />
          </div>
          <div className="gradient-border-container">
            <img
              ref={imgRef}
              src={user?.league.avatarUrl}
              //@ts-ignore
              onTouchStart={handleTouchStart}
              //@ts-ignore
              onTouchMove={handleTouchMove}
              //@ts-ignore
              onTouchEnd={handleTouchEnd}
              //@ts-ignore
              onTouchCancel={handleTouchEnd}
              onClick={handleClickEvent}
              onContextMenu={handleContextMenu}
              className={`text-lg border-none filter drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)) rounded-full p-4
                ${
                  imageClicked
                    ? "transform scale-90 transition-transform duration-75 ease-in-out"
                    : ""
                }`}
              alt="egg"
            />
          </div>
          <EnergyProgress energyCount={energyCount} />

          {numberSignPositions.map((position) => (
            <NumberSign
              key={position.id}
              x={position.x}
              y={position.y}
              id={position.id}
              onAnimationEnd={handleAnimationEnd}
            />
          ))}
        </>
      )}
    </div>
  );
};
