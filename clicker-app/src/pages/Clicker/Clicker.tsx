import React, { useState, useRef, useMemo, useEffect } from "react";
import { useClick } from "../../hooks/useClick";
import NumberSign from "../../components/NumberSign";
import { EnergyProgress } from "../../components/EnergyProgress";
import { ScoreCounter } from "../../components/ScoreCounter";
import { useUser } from "../../hooks/useUser";
import { useSkeletonLoading } from "../../hooks/useSkeletonLoading";
import { ClickerSkeleton } from "./ClickerSkeleton";
import "./Clicker.css"; // Создайте и импортируйте CSS файл
import { calculateLevel } from "../../utils/calculateLevel";

export const Clicker: React.FC = () => {
  const { handleClick } = useClick();
  const imgRef = useRef<HTMLImageElement>(null);

  const [numberSignPositions, setNumberSignPositions] = useState<
    { x: number; y: number; id: number }[]
  >([]);
  const [numberSignId, setNumberSignId] = useState<number>(0);
  const [activeTouches, setActiveTouches] = useState<Set<number>>(new Set());
  const [imageClicked, setImageClicked] = useState<boolean>(false);
  const { user } = useUser();
  const isSkeletonLoading = useSkeletonLoading();

  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTouchStart = (event: TouchEvent) => {
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
        }));

      if ((user?.energy || 0) > 0) {
        setNumberSignId((prevId) => prevId + touchPositions.length);

        setImageClicked(true);
        setTimeout(() => setImageClicked(false), 50);

        setNumberSignPositions((prevPositions) => [
          ...prevPositions,
          ...touchPositions,
        ]);
      }

      touchPositions.forEach(() => {
        if (user) {
          handleClick({
            user_id: user.tgId,
            multiplier: multiplier,
          });
        }
      });

      setActiveTouches(newTouches);
    }
  };

  const handleTouchMove = () => {};

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
    event.preventDefault();
  };
  const multiplier = useMemo(() => {
    //user.x2ExpiresAt && new Date(user.x2ExpiresAt).getTime() - now
    // user.handicapExpiresAt && new Date(user.handicapExpiresAt).getTime() - now
    if (!user) return 1;
    const innerNow = Date.now();
    if (
      user.isBoostX2Active &&
      user.x2ExpiresAt &&
      user.x2ExpiresAt > innerNow
    ) {
      return 2;
    }
    if (
      user.isHandicapActive &&
      user.handicapExpiresAt &&
      user.handicapExpiresAt > innerNow
    ) {
      return 5;
    }
    return 1;
  }, [user]);
  return (
    <div
      className="text-center p-4 pt-0 relative flex flex-col items-center justify-between pb-44 h-full"
      onScroll={(e) => e.preventDefault()}
    >
      {isSkeletonLoading ? (
        <ClickerSkeleton />
      ) : (
        <>
          <div className="flex flex-col justify-center items-center w-full mb-2 gap-2">
            <ScoreCounter clickCount={user?.score || 0} />
            {/* <League /> */}
            {/* <DailyOffer />
            <ComboGame /> */}
            {/* <div>+{user?.totalIncomePerHour} per hour</div> */}
          </div>

          <img
            ref={imgRef}
            // src={user?.league.avatarUrl}
            src="/img/kolobok.png"
            //@ts-ignore
            onTouchStart={handleTouchStart}
            //@ts-ignore
            onTouchMove={handleTouchMove}
            //@ts-ignore
            onTouchEnd={handleTouchEnd}
            //@ts-ignore
            onTouchCancel={handleTouchEnd}
            // onClick={handleClickEvent}
            onContextMenu={handleContextMenu}
            className={`text-lg border-none filter rounded-full max-w-full -my-[10px] max-h-[92%] aspect-square
                ${
                  imageClicked
                    ? "transform scale-90 transition-transform duration-75 ease-in-out"
                    : ""
                }`}
            alt="img"
          />

          {/* <Statistics /> */}
          <EnergyProgress
            energyCount={user?.energy || 0}
            maxEnergy={user?.maxEnergy}
          />

          {user?.isBoostX2Active &&
            user.x2ExpiresAt &&
            new Date(user.x2ExpiresAt).getTime() - now > 0 && (
              <div className="bg-[#7437B9BD] px-3 py-2 mt-2 rounded-xl">
                Boost x2 active{" "}
                <span>
                  {new Date(user.x2ExpiresAt - now).toISOString().substr(11, 8)}
                </span>
              </div>
            )}

          {user?.isHandicapActive &&
            user.handicapExpiresAt &&
            new Date(user.handicapExpiresAt).getTime() - now > 0 && (
              <div className="bg-[#7437B9BD] px-3 py-2 mt-2 rounded-xl">
                Boost handicap(x5) active{" "}
                <span>
                  {new Date(user.handicapExpiresAt - now)
                    .toISOString()
                    .substr(11, 8)}
                </span>
              </div>
            )}

          {numberSignPositions.map((position) => (
            <NumberSign
              key={position.id}
              x={position.x}
              y={position.y}
              id={position.id}
              rewardPerClick={calculateLevel(user?.score || 0) * multiplier}
              onAnimationEnd={handleAnimationEnd}
            />
          ))}
        </>
      )}
    </div>
  );
};
