import React, { useState, useEffect, useRef } from "react";
import { Task } from "../../models";
import { EggSvg } from "../Layout/EggSvg";
import { LargerEggSvg } from "../Businesses/LargerEggSvg";

export const TaskModal = ({
  task,
  onClose,
  onOpenLink,
  onCheckStatus,
}: {
  task: Task;
  onClose: any;
  onOpenLink: any;
  onCheckStatus: any;
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

  if (!task) return null;

  return (
    <>
      <div className="overlay" onClick={handleClose} />
      <div
        id="modal"
        className={`modal ${visible ? "visible" : "hidden"} h-96`}
        ref={modalRef}
      >
        <img className="h-20 w-20 rounded-full" src={task.avatarUrl} />
        <div className="text-xl mt-4 text-center">{task.name}</div>
        <div className="text-xs mb-6 mt-4 text-center">{task.description}</div>
        <div className="flex justify-end space-x-2">
          <button
            className="py-2 px-6 text-sm rounded-lg flex justify-center items-center"
            style={{
              background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
            }}
            onClick={onOpenLink}
          >
            {task.type === "telegram" ? "Open Link" : "Go"}
          </button>
        </div>
        <div className="flex flex-column justify-center items-center mt-4">
          <LargerEggSvg />
          <div className="text-3xl ml-2">+{task.rewardAmount}</div>
        </div>
        {!task.completed && task.type === "telegram" && (
          <button
            className="mt-4 py-2 px-8 text-sm rounded-lg flex justify-center items-center"
            style={{
              background: "linear-gradient(180deg, #F4895D 0%, #FF4C64 100%)",
            }}
            onClick={onCheckStatus}
          >
            Check Status
          </button>
        )}
      </div>
    </>
  );
};
