import React, { useEffect, useState } from "react";
import { Task } from "../../../models";
import { getConfig } from "../../../utils/config";
import { Link } from "react-router-dom";

const { adminApiUrl } = getConfig();

export const AdminTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "non-active">("all");

  useEffect(() => {
    refreshTasks();
  }, [filter]);

  const refreshTasks = async () => {
    const response = await fetch(`${adminApiUrl}/admin/tasks?filter=${filter}`);
    const tasks = await response.json();
    setTasks(tasks);
  };

  const handleFilterClick = () => {
    if (filter === "all") {
      setFilter("active");
    } else if (filter === "active") {
      setFilter("non-active");
    } else {
      setFilter("all");
    }
  };

  const handleDeactivateClick = async (taskId: string) => {
    if (window.confirm("Are you sure?")) {
      const response = await fetch(
        `${adminApiUrl}/admin/tasks/${taskId}/deactivate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        refreshTasks();
      }
    }
  };

  const handleActivateClick = async (taskId: string) => {
    if (window.confirm("Are you sure?")) {
      const response = await fetch(
        `${adminApiUrl}/admin/tasks/${taskId}/activate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        refreshTasks();
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col space-y-2">
        <Link
          to="add"
          className="bg-green-600 hover:bg-green-700 text-white font-light py-1 px-4 w-full font-mono text-center"
        >
          ADD TASK
        </Link>

        <button
          className="bg-slate-50 hover:bg-slate-300 font-light py-1 px-4 w-full font-mono text-black"
          onClick={handleFilterClick}
        >
          Filter: {filter}
        </button>
      </div>

      <div
        className="flex flex-col space-y-2"
        style={{ maxHeight: "80vh", overflow: "scroll" }}
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-row bg-slate-50 px-2 py-2 justify-between text-black"
          >
            <img src={task.avatarUrl} className="w-10 h-10 rounded-full" />
            <div className="flex flex-col w-2/4">
              <div className="font-bold">{task.name}</div>
              <div className="text-xs font-light">{task.description}</div>
              <div className="text-xs font-light">
                Reward: {task.rewardAmount}
              </div>
            </div>
            {task.active ? (
              <button
                className="bg-red-300 px-4 w-1/4"
                onClick={() => handleDeactivateClick(task.id)}
              >
                Deactivate
              </button>
            ) : (
              <button
                className="bg-green-300 px-4 w-1/4"
                onClick={() => handleActivateClick(task.id)}
              >
                Activate
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
