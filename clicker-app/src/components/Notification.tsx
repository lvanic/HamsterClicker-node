import { useRef, useEffect, memo } from "react";
import { NotifyMessage } from "../contexts/NotifyContext";
import { SuccessSvg } from "./SuccessSvg";

const Notification = ({
  notify,
  onClose,
}: {
  notify: NotifyMessage;
  onClose: any;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    modalRef.current?.classList.add("visible");
    overlayRef.current?.classList.add("visible");
    return () => {
      modalRef.current?.classList.remove("visible");
      overlayRef.current?.classList.remove("visible");
    };
  }, [notify]);

  const overlayClickHandle = () => {
    modalRef.current?.classList.remove("visible");
    overlayRef.current?.classList.remove("visible");
    onClose();
  };

  return (
    <>
      <div
        ref={overlayRef}
        className="overlay"
        onClick={overlayClickHandle}
      />
      <div
        id="modal"
        className={`modal ${notify.className}`}
        ref={modalRef}
        style={{ zIndex: 20 }}
      >
        <div
          className={
            "w-full h-full flex flex-col justify-center items-center rounded-b-xl pt-10 " +
            (notify.status == "task" ? "text-[#35CE28]" : "text-red")
          }
          style={{
            backgroundImage:
              notify.status === "task"
                ? "URL(./img/background_egg.png)"
                : "none",
            backgroundSize: notify.status === "task" ? "60%" : "none",
            backgroundRepeat: notify.status === "task" ? "no-repeat" : "none",
            backgroundPosition: notify.status === "task" ? "center" : "none",
          }}
        >
          <div className="text-lg text-center">{notify.message}</div>
          <div className="mt-8">
            {notify.status == "task" || notify.status == "ok" ? (
              // <SuccessSvg /> 
              null
            ) : null}
          </div>
          {notify.closeButton && (
            <button
              className="text-white px-6 py-2 relative top-8 rounded-lg"
              style={{
                background: "linear-gradient(180deg, #FFCB83 0%, #FFAE4C 100%)",
              }}
            >
              Сompleted
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(Notification);
