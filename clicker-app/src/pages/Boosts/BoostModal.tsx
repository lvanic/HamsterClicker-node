import React, { useState, useEffect, useRef } from "react";
import { SmallEggSvg } from "../../components/SmallEggSvg";
import { MediumEggSvg } from "../Businesses/MediumEggSvg";

export const BoostModal = ({
  Icon,
  onClose,
  onPurchase,
  title,
  description,
  additionalInfo,
  eggIcon,
  purchaseText,
}: {
  Icon: any;
  onClose: any;
  onPurchase: any;
  title: string;
  description: string;
  additionalInfo?: string;
  eggIcon: boolean;
  purchaseText: string;
}) => {
  const [visible, setVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(true); // Trigger the animation on mount

    return () => {
      setVisible(false); // Clean up on unmount
    };
  }, []);

  const purchaseHandler = () => {
    handleClose();
    onPurchase();
  };

  const handleClose = () => {
    setVisible(false); // Trigger the exit animation
    setTimeout(onClose, 300); // Wait for the animation to finish before closing
  };

  return (
    <>
      <div className="overlay" onClick={handleClose} />
      <div
        id="modal"
        className={`modal ${visible ? "visible" : "hidden"} h-72`}
        ref={modalRef}
      >
        <div
          className="flex h-16 w-16 items-center mt-5 justify-center bg-[#FFAE4C] rounded-full p-2"
          style={{
            boxShadow: "0px 0px 48.28px 0px #FFAE4C",
          }}
        >
          <Icon />
        </div>
        <div className="text-xl mt-6">{title}</div>
        <div className="text-xs">{description}</div>
        {additionalInfo && (
          <div className="mt-6 flex">
            <div className="flex flex-col justify-center items-left">
              <div className="text-xs">{additionalInfo}</div>
            </div>
          </div>
        )}
        <button
          onClick={purchaseHandler}
          className="mt-4 py-2 px-6 text-sm rounded-lg flex justify-center items-center"
          style={{
            background: "linear-gradient(180deg, #FFCB83 0%, #FFAE4C 100%)",
          }}
        >
          {eggIcon && (
            <div className="mr-2">
              {/* <MediumEggSvg /> */}
            </div>
          )}
          <div>{purchaseText}</div>
        </button>
      </div>
    </>
  );
};
