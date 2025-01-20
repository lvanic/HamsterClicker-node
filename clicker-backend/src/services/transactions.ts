import { appDataSource } from "../core/database"
import { Task } from "../models/task";
import { User } from "../models/user";

// typeof taskId is number may be wrong, should be double-checked
export const checkTaskStatus = (tgUserId: number, taskId: number) => {
  appDataSource.transaction(async (transactionalEntityManager) => {
    const task = await transactionalEntityManager.findOneBy(Task, { id: taskId });

    if (!task) {
      return;
    }

    const user = await transactionalEntityManager.findOneBy(User, { tgId: tgUserId });

    if (!user) {
      return;
    }

    const someCondition = user.completedTasks.find((ut) => ut.toString() === task.id.toString());


    if (someCondition) {
      return
    }
  });
}