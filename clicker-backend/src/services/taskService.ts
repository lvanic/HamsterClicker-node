import { appDataSource } from "../core/database";
import { Task } from "../models/task";

const taskRepository = appDataSource.getRepository(Task);

export const findTaskById = (taskId: number): Promise<Task | null> => {
  return taskRepository.findOneBy({ id: taskId });
};
