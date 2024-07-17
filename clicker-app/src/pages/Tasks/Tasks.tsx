import React, { useState, useEffect } from "react";
import { useWebSocket } from "../../hooks/useWebsocket";
import { getTelegramUser } from "../../services/telegramService";
import { useUser } from "../../hooks/useUser";
import { TaskSkeleton } from "./TaskSkeleton";
import { TaskModal } from "./TaskModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Tasks = () => {
  const [tasks, setTasks] = useState<any>([]);
  const { webSocket } = useWebSocket();
  const { user } = useUser();
  const [isDataLoading, setDataLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null); // Добавляем состояние для выбранной задачи

  useEffect(() => {
    if (webSocket) {
      webSocket.emit("getTasks");

      webSocket.on("tasks", (receivedTasks) => {
        setDataLoading(false);
        if (user?.completedTasks) {
          const updatedTasks = receivedTasks.map((task: any) => {
            const isCompleted = user?.completedTasks.some(
              (completedTask: any) => completedTask === task._id
            );

            return { ...task, completed: isCompleted };
          });
          setTasks(updatedTasks);
        } else {
          setTasks(receivedTasks);
        }
      });

      webSocket.on("taskStatus", (data) => {
        const { id, finished } = data;
        setTasks((prevTasks: any) =>
          prevTasks.map((task: any) =>
            task._id === id ? { ...task, completed: finished } : task
          )
        );
        if (finished) {
          toast.success("Task completed!");
        } else {
          toast.error("Task not completed yet.");
        }
      });
    }
    return () => {
      webSocket?.off("tasks");
      webSocket?.off("taskStatus");
    };
  }, [webSocket, user]);

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
  };

  const handleModalClose = () => {
    setSelectedTask(null);
  };

  const handleOpenLink = () => {
    if (selectedTask.type !== "telegram" && tasks[selectedTask._id] == false) {
      const tgUserId = getTelegramUser().id;
      webSocket?.emit(
        "checkTaskStatus",
        JSON.stringify([tgUserId, selectedTask._id])
      );
    }

    window.open(selectedTask.activateUrl, "_blank");
  };

  const handleCheckStatus = () => {
    const tgUserId = getTelegramUser().id;
    webSocket?.emit(
      "checkTaskStatus",
      JSON.stringify([tgUserId, selectedTask._id])
    );
  };

  return (
    <div className="font-sans p-5 rounded-lg max-w-md mx-auto">
      <ToastContainer />
      {isDataLoading ? (
        <TaskSkeleton />
      ) : (
        <ul
          className="list-none p-0"
          style={{ maxHeight: window.innerHeight - 84, overflowY: "scroll" }}
        >
          {tasks.map((task: any) => (
            <li
              key={task.id}
              className="p-3 my-2 bg-white bg-opacity-20 rounded-md flex justify-between items-center shadow-sm"
              onClick={() => handleTaskClick(task)}
            >
              <div className="w-1/2 flex flex-row justify-center align-center">
                <img
                  src={task.avatarUrl}
                  style={{ width: "30%" }}
                  className="mr-2 rounded-xl"
                />
                <span
                  className={
                    task.completed ? "text-gray-500 line-through" : "text-white"
                  }
                >
                  {task.name}
                </span>
              </div>
              {!task.completed && (
                <span className="px-2 py-2 flex items-center bg-white bg-opacity-30 rounded-md ms-1">
                  <span className="text-white me-2">{task.rewardAmount}</span>
                  <img src="./img/sisechka_coin.png" className="w-10" />
                </span>
              )}
              {task.completed ? (
                <span className="text-green-600 font-bold"> (completed)</span>
              ) : (
                <button
                  className="px-4 py-2 ms-2 bg-white bg-opacity-30 text-white rounded-full hover:bg-opacity-50 transition duration-300"
                  // onClick={() => handleGoClick(task)}
                >
                  &gt;
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <TaskModal
        task={selectedTask}
        onClose={handleModalClose}
        onOpenLink={handleOpenLink}
        onCheckStatus={handleCheckStatus}
      />
    </div>
  );
};
