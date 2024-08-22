import { useRef, useEffect } from "react";
import { NotifyMessage } from "../contexts/NotifyContext";
import { SuccessSvg } from "./SuccessSvg";

export const Notification = ({
  notify,
  onClose,
}: {
  notify: NotifyMessage;
  onClose: any;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    // Clear any existing timers
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Add the "visible" class and start new timers
    const TIMEOUT = 3000;
    modalRef.current?.classList.add("visible");

    timeoutRef.current = setTimeout(() => {
      modalRef.current?.classList.remove("visible");
      modalRef.current?.classList.add("hidden");
    }, TIMEOUT - 300);

    timeoutRef.current = setTimeout(() => {
      onClose();
    }, TIMEOUT);

    return () => {
      // Clear any remaining timers on unmount
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notify, onClose]);

  const overlayClickHandle = () => {
    modalRef.current?.classList.remove("visible");
    modalRef.current?.classList.add("hidden");
    onClose();
  };

  return (
    <>
      <div className="overlay-safe" onClick={overlayClickHandle} />
      <div
        id="modal"
        className={`modal ${notify.className}`}
        ref={modalRef}
        style={{ zIndex: 20 }}
      >
        <div
          className={
            "w-full h-full bg-[#282828] flex flex-col justify-center items-center rounded-b-xl " +
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
            {notify.status == "task" ? <SuccessSvg /> : null}
          </div>
          {/* <div className="text-white mt-2 text-sm">
    {notify.status == "task"
    ? "Сonfirmed"
    : notify.status == "ok"
    ? "Success"
    : "Something went wrong"}
    </div> */}
          {notify.closeButton && (
            <button
              className="text-white px-6 py-2 relative top-8 rounded-lg"
              style={{
                background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
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
