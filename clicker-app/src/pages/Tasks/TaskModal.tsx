import React, { useRef, useEffect } from "react";

export const TaskModal = ({
  task,
  onClose,
  onOpenLink,
  onCheckStatus,
}: any) => {
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

  if (!task) return null;

  return (
    <>
      <div className="overlay" onClick={handleClose} />
      <div id="modal" className="modal h-72" ref={modalRef}>
        <div className="text-xl mt-6">{task.name}</div>
        <div className="text-xs mb-4">{task.description}</div>
        <div className="text-xs mb-4">Reward: {task.rewardAmount}</div>
        <div className="flex justify-end space-x-2">
          <button
            className="py-2 px-6 text-sm rounded-lg flex justify-center items-center"
            style={{
              background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
            }}
            onClick={onOpenLink}
          >
            {task.type == "telegram" ? "Open Link" : "Go"}
          </button>
          {!task.completed && task.type == "telegram" && (
            <button
              className="py-2 px-6 text-sm rounded-lg flex justify-center items-center"
              style={{
                background: "linear-gradient(180deg, #34D399 0%, #059669 100%)",
              }}
              onClick={onCheckStatus}
            >
              Check Status
            </button>
          )}
          <button
            className="py-2 px-6 text-sm rounded-lg flex justify-center items-center"
            style={{
              background: "linear-gradient(180deg, #EF4444 0%, #DC2626 100%)",
            }}
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};
