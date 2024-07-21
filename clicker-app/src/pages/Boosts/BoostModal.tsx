import { useRef, useEffect } from "react";
import { SmallEggSvg } from "../../components/SmallEggSvg";

export const BoostModal = ({
  Icon,
  onClose,
  title,
  description,
  additionalInfo,
  eggIcon,
  purchaseText,
}: {
  Icon: any;
  onClose: any;
  title: string;
  description: string;
  additionalInfo?: string;
  eggIcon: boolean;
  purchaseText: string;
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
        <Icon />
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
          onClick={() => {}}
          className="mt-4 py-2 px-6 text-sm rounded-lg"
          style={{
            background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
          }}
        >
          {eggIcon && (
            <div className="mr-2">
              <SmallEggSvg />
            </div>
          )}
          <div>{purchaseText}</div>
        </button>
      </div>
    </>
  );
};
