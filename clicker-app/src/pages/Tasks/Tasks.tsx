import React, { useState, useEffect, useContext } from "react";
import { useWebSocket } from "../../hooks/useWebsocket";
import { getTelegramUser } from "../../services/telegramService";
import { useUser } from "../../hooks/useUser";
import { TaskSkeleton } from "./TaskSkeleton";
import { TaskModal } from "./TaskModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { EggSvg } from "../Layout/EggSvg";

import { EggNimbus } from "../../components/EggNimbus";
import { TaskList } from "./TaskList";
import { NotifyContext, NotifyMessage } from "../../contexts/NotifyContext";
import { DataContext } from "../../contexts/DataContext";
import { Task } from "../../models";

export const Tasks = () => {
  const { webSocket } = useWebSocket();
  const { user } = useUser();
  const [isDataLoading, setDataLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const notifyContext = useContext(NotifyContext);
  const dataContext = useContext(DataContext);

  useEffect(() => {
    if (webSocket) {
      webSocket.emit("getTasks");

      webSocket.on("taskStatus", (data) => {
        const { id, finished } = data;

        dataContext?.setTasks((prevTasks: any) => {          
          return prevTasks.map((task: any) =>
            task._id == id ? { ...task, completed: finished } : task
          );
        });

        let notify: NotifyMessage;
        if (finished) {
          notify = {
            message: "Task completed!",
            status: "ok",
            className: "h-72",
          };
        } else {
          notify = {
            message: "Task not completed yet.",
            status: "error",
            className: "h-72",
          };
        }
        notifyContext?.setNotify(notify);
      });
    }
    return () => {
      webSocket?.off("taskStatus");
    };
  }, [webSocket]);

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
  };

  const handleModalClose = () => {
    setSelectedTask(null);
  };

  const handleOpenLink = () => {
    if (selectedTask && selectedTask._id) {
      const task = dataContext?.tasks.find(
        (task: any) => task._id === selectedTask._id
      );
      const isTaskCompleted = task?.completed;

      if (selectedTask.type !== "telegram" && !isTaskCompleted) {
        const tgUserId = getTelegramUser().id;
        webSocket?.emit(
          "checkTaskStatus",
          JSON.stringify([tgUserId, selectedTask._id])
        );
      }

      window.open(selectedTask.activateUrl, "_blank");
    }
  };

  const handleCheckStatus = () => {
    const tgUserId = getTelegramUser().id;
    webSocket?.emit(
      "checkTaskStatus",
      JSON.stringify([tgUserId, selectedTask._id])
    );
  };

  return (
    <>
      <div className="font-sans p-5 rounded-lg max-w-md mx-auto">
        <div className="text-2xl text-center w-full">Earn more rewards</div>
        <div className="w-full flex justify-center items-center mt-6 mb-6">
          <EggNimbus className="absolute w-40 h-52" />
          <EggSvg className="w-24 h-32" />
        </div>
        <div className="text-center">
          Complete tasks and
          <br /> get rewards
        </div>

        {isDataLoading ? (
          <TaskSkeleton />
        ) : (
          <ul
            className="list-none p-0"
            style={{ maxHeight: window.innerHeight - 338, overflowY: "scroll" }}
          >
            <div>Daily reward</div>
            <TaskList
              tasks={dataContext?.tasks}
              handleTaskClick={handleTaskClick}
              filter="telegram"
            />
            <div>List of tasks</div>
            <TaskList
              tasks={dataContext?.tasks}
              handleTaskClick={handleTaskClick}
              filter="link"
            />
          </ul>
        )}
      </div>
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={handleModalClose}
          onOpenLink={handleOpenLink}
          onCheckStatus={handleCheckStatus}
        />
      )}
    </>
  );
};
