import { useEffect, useRef } from "react";
import { SmallEggSvg } from "../../components/SmallEggSvg";
import { Business } from "../../models";

export const BuyBusiness = ({
  business,
  onBuyBusiness,
  onClose,
}: {
  business: Business;
  onBuyBusiness: any;
  onClose: any;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    modalRef.current?.classList.add("visible");

    return () => {
      modalRef.current?.classList.remove("visible");
    };
  }, []);

  const handleClose = () => {
    modalRef.current?.classList.remove("visible");
    modalRef.current?.classList.add("hidden");
    setTimeout(onClose, 300);
  };

  return (
    <>
      <div className="overlay" onClick={handleClose} />
      <div id="modal" className="modal" ref={modalRef}>
        <img src={business?.avatarUrl} className="w-16 h-16 rounded-full" />
        <div className="text-xl mt-6">{business?.name}</div>
        <div className="text-xs">{business?.description}</div>
        <div className="mt-6 flex">
          <div className="flex flex-col justify-center items-left">
            <div className="text-xs">Profit per hour</div>
            <div className="flex justify-left items-center">
              <SmallEggSvg />
              <div className="ml-1">{business?.rewardPerHour}</div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-left ml-2">
            <div className="text-xs">Price</div>
            <div className="flex justify-left items-center">
              <SmallEggSvg />
              <div className="ml-1">{business?.price}</div>
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
          Buy this
        </button>
      </div>
    </>
  );
};
