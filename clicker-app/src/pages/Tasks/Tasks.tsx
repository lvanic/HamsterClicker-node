import React, { useState, useEffect, useContext } from "react";
import { useWebSocket } from "../../hooks/useWebsocket";
import { getTelegramUser } from "../../services/telegramService";
import { useUser } from "../../hooks/useUser";
import { TaskSkeleton } from "./TaskSkeleton";
import { TaskModal } from "./TaskModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { TaskList } from "./TaskList";
import { NotifyContext, NotifyMessage } from "../../contexts/NotifyContext";
import { DataContext } from "../../contexts/DataContext";
import { Task } from "../../models";
import { getLocalization } from "../../localization/getLocalization";
import { getSettings } from "../../services/getSettings";
import { useSettings } from "../../hooks/useSettings";
import { formatDate } from "../../utils/formatDate";

export const Tasks = () => {
  const { webSocket } = useWebSocket();
  const { user, setUser } = useUser();
  const [isDataLoading, setDataLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const appSettigs = useSettings();

  const notifyContext = useContext(NotifyContext);
  const dataContext = useContext(DataContext);

  useEffect(() => {
    if (webSocket) {
      webSocket.emit("getTasks");

      webSocket.on("taskStatus", (data) => {
        const { id, finished } = data;
        setTimeout(() => {
          dataContext?.setTasks((prevTasks: any) => {
            return prevTasks.map((task: any) =>
              task.id == id ? { ...task, completed: finished } : task
            );
          });

          let notify: NotifyMessage;
          if (finished) {
            notify = {
              message: getLocalization("taskCompleted"),
              status: "task",
              className: "h-96",
            };
          } else {
            notify = {
              message: getLocalization("taskNotCompleted"),
              status: "error",
              className: "h-96",
            };
          }
          setSelectedTask(null);
          notifyContext?.setNotify(notify);
        }, 3000);
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
    if (selectedTask && selectedTask.id) {
      const task = dataContext?.tasks.find(
        (task: any) => task.id === selectedTask.id
      );

      const isTaskCompleted = task?.completed;

      if (selectedTask.type !== "telegram" && !isTaskCompleted) {
        const tgUserId = getTelegramUser().id;
        webSocket?.emit(
          "checkTaskStatus",
          JSON.stringify([tgUserId, selectedTask.id])
        );
      }

      window.open(selectedTask.activateUrl, "_blank");
    }
  };

  const handleCheckStatus = () => {
    const tgUserId = getTelegramUser().id;
    webSocket?.emit(
      "checkTaskStatus",
      JSON.stringify([tgUserId, selectedTask.id])
    );
  };

  return (
    <>
      <div className="p-5 rounded-lg max-w-md mx-auto">
        <div className="text-2xl text-center w-full">
          {getLocalization("earnMoreRewards")}
        </div>
        <div className="w-full flex justify-center items-center mt-6 mb-6"></div>
        <div className="text-center">
          {getLocalization("completeTaskAndGetReward")}
        </div>

        {isDataLoading ? (
          <TaskSkeleton />
        ) : (
          <ul
            className="list-none p-0"
            style={{ maxHeight: window.innerHeight - 270, overflowY: "scroll" }}
          >
            {appSettigs.isRewardForReferalActive && (
              <li className="py-3 px-4 my-2 bg-[#1D1932] rounded-2xl flex justify-between items-center shadow-sm relative overflow-hidden">
                <img
                  className="absolute z-[-1] w-full h-full left-0 top-0"
                  src="/img/task-mask.png"
                />
                <div className="w-full flex flex-row justify-left items-center">
                  {/* <img
                src={task.avatarUrl}
                className="mr-2 rounded-full w-8 h-8"
              /> */}
                  <div onClick={(e) => {
                    
                    if (user?.isReferralTaskActive) {
                      toast.error("You already have an active referral task");
                      return;
                    }
                    webSocket?.emit("checkTaskStatus",JSON.stringify([user?.tgId, "referral"]));
                    setUser?.((prevUser) => {
                      if (!prevUser) return prevUser; // Ensure prevUser is not null
                      return {
                        ...prevUser,
                        isReferralTaskActive: true,
                      };
                    });
                  }}>
                    <span className={"text-xs text-white leading-none"}>
                      Referral reward (receive +{appSettigs.referralReward} for {appSettigs.newRefferalsToActivate} friends) ends: {formatDate(appSettigs.referralTaskEndsAt)}
                    </span>
                    <span className="flex felx-row justify-left ml-2 items-center">
                      <img src="/img/bag.png" className="w-4" />
                      <div className="ml-2 text-lg">
                        {user?.isReferralTaskActive ? "In progress" : "Participate"}
                      </div>
                    </span>
                  </div>
                </div>
              </li>
            )}
            <div> {getLocalization("listOfTasks")}</div>
            <TaskList
              tasks={dataContext?.tasks}
              handleTaskClick={handleTaskClick}
              filter="telegram"
            />
            {/* <div> {getLocalization("listOfTasks")}</div>
            <TaskList
              tasks={dataContext?.tasks}
              handleTaskClick={handleTaskClick}
              filter="link"
            /> */}
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
