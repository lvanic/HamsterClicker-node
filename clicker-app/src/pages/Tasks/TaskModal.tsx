import React, { useState, useEffect, useRef } from "react";
import { Task } from "../../models";
import { LargerEggSvg } from "../Businesses/LargerEggSvg";
import { getLocalization } from "../../localization/getLocalization";

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
    setVisible(true);

    return () => {
      setVisible(false);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!task) return null;

  const handleClickGo = () => {    
    onOpenLink()
  }

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
            className="py-2 px-6 text-sm rounded-lg flex justify-center items-center text-black"
            style={{
              background: "linear-gradient(180deg, #FFCB83 0%, #FFAE4C 100%)",
            }}
            onClick={handleClickGo}
          >
            {task.type === "telegram"
              ? getLocalization("openLink")
              : getLocalization("go")}
          </button>
        </div>
        <div className="flex flex-column justify-center items-center mt-4">
          <div className="text-3xl ml-2">+{task.rewardAmount}</div>
        </div>
        {!task.completed && task.type === "telegram" && (
          <button
            className="mt-4 py-2 px-8 text-sm rounded-lg flex justify-center items-center text-black"
            style={{
              background: "linear-gradient(180deg, #FFCB83 0%, #FFAE4C 100%)",
            }}
            onClick={onCheckStatus}
          >
            {getLocalization("checkStatus")}
          </button>
        )}
      </div>
    </>
  );
};
