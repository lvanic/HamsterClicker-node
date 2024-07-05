import { useEffect, useState } from "react";
import { useWebSocket } from "./useWebsocket";

type Task = {
  id: string;
  name: string;
  description: string;
  url: string;
  status: "todo" | "in-progress" | "done";
};

export const useTask = () => {
  const { webSocket } = useWebSocket();
  const [tasks, setTasks] = useState<Task[]>([]);

  const checkTaskStatus = (id: string) => {
    webSocket?.emit("checkTaskStatus", id);
  };

  useEffect(() => {
    webSocket?.emit("getTasks");

    webSocket?.on("tasks", (data: any) => {
      setTasks(data);
    });

    webSocket?.on("taskStatus", (data: any) => {
      const updatedTasks = tasks.map((task) => {
        if (task.id === data.id) {
          return { ...task, status: data.status };
        }
        return task;
      });

      setTasks(updatedTasks);
    });

    return () => {
      webSocket?.off("tasks");
      webSocket?.off("taskStatus");
    };
  }, [webSocket, tasks]);

  return { tasks };
};
