import { useEffect, useRef, useState } from "react";
import { SmallEggSvg } from "../../components/SmallEggSvg";
import { Business } from "../../models";
import { formatNumber } from "../../utils/formatNumber";
import { getLocalization } from "../../localization/getLocalization";

export const BuyBusiness = ({
  business,
  onBuyBusiness,
  onClose,
}: {
  business: Business;
  onBuyBusiness: any;
  onClose: any;
}) => {
  const [visible, setVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(true); // Trigger the animation on mount

    return () => {
      setVisible(false); // Clean up on unmount
    };
  }, []);

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
        <img src={business?.avatarUrl} className="w-16 h-16 rounded-full" />
        <div className="text-xl mt-6">{business?.name}</div>
        <div className="text-xs">{business?.description}</div>
        <div className="mt-6 flex">
          <div className="flex flex-col justify-center items-left">
            <div className="text-xs">{getLocalization("profitPerHour")}</div>
            <div className="flex justify-left items-center">
              <SmallEggSvg />
              <div className="ml-1">
                {formatNumber(business?.rewardPerHour)}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-left ml-2">
            <div className="text-xs">{getLocalization("price")}</div>
            <div className="flex justify-left items-center">
              <SmallEggSvg />
              <div className="ml-1">{formatNumber(business?.price)}</div>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            onBuyBusiness(business?.id);
          }}
          className="mt-4 py-2 px-6 text-sm rounded-lg"
          style={{
            background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
          }}
        >
          {getLocalization("buyThis")}
        </button>
      </div>
    </>
  );
};
