import React, { useEffect, useState } from "react";
import EthereumButton from "../../components/TonButton/TonButton";
import TonButton from "../../components/TonButton/TonButton";
import { getLocalization } from "../../localization/getLocalization";
import { BigEggSvg } from "./BigEggSvg";

const AIRDROP_DATE = new Date("2025-02-21T00:00:00Z");

export const Airdrop = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = AIRDROP_DATE.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-between h-full pb-16">
      <div className="text-2xl mb-6 xl:mt-6 uppercase text-center">
        {getLocalization("wallet")}
      </div>
      <div className="relative w-full h-56 sm:h-60">
        <img
          src="/img/bun-coin.png"
          className="absolute -top-8 w-full opacity-100"
          alt="Bun Coin"
        />
      </div>
      
      <div className="text-4xl text-[#FF4340B2] z-50 text-center">
        AIRDROP IN
      </div>
      <div
        className="flex items-center gap-1 z-50 mb-4 px-4 py-0.5 rounded-2xl"
        style={{
          // backdropFilter: "blur(20px)",
        }}
      >
        <div className="text-center">
          <div className="text-4xl sm:text-5xl">{timeLeft.days}</div>
          <div className="font-extralight text-sm sm:text-base">days</div>
        </div>
        <div className="text-5xl">:</div>
        <div className="text-center">
          <div className="text-4xl sm:text-5xl">{timeLeft.hours}</div>
          <div className="font-extralight text-sm sm:text-base">hours</div>
        </div>
        <div className="text-5xl">:</div>
        <div className="text-center">
          <div className="text-4xl sm:text-5xl">{timeLeft.minutes}</div>
          <div className="font-extralight text-sm sm:text-base">minutes</div>
        </div>
        <div className="text-5xl">:</div>
        <div className="text-center">
          <div className="text-4xl sm:text-5xl">{timeLeft.seconds}</div>
          <div className="font-extralight text-sm sm:text-base">seconds</div>
        </div>
      </div>
      <TonButton className="z-50" />
    </div>
  );
};
