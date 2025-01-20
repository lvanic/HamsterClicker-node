import { Socket } from "socket.io";
import { appDataSource } from "../core/database";
import { Task } from "../models/task";
import { User } from "../models/user";
import { config } from "../core/config";

export const checkTaskStatus = async (tgId: number, taskId: number, io: Socket) => {
  await appDataSource.transaction(async (transactionalEntityManager) => {
    try {
      // Получение задачи
      const task = await transactionalEntityManager.findOneBy(Task, {
        id: taskId
      });
      if (!task) {
        return;
      }

      // Получение пользователя
      const user = await transactionalEntityManager.findOne(User, { where: { tgId } });
      if (!user) {
        return;
      }

      // Проверка на уже выполненное задание
      if (user.completedTasks.some((completedTask) => completedTask.id === task.id)) {
        return;
      }

      if (task.type === 'telegram') {
        const slices = task.activateUrl.split('/');
        const tgChatId = slices[slices.length - 1];

        const response = await fetch(
          `https://api.telegram.org/bot${config.TG_BOT_TOKEN}/getChatMember?chat_id=@${tgChatId}&user_id=${tgId}`
        );
        const responseData = (await response.json()) as {
          ok: boolean;
          result: { status: string };
        };

        if (
          responseData.ok &&
          responseData.result &&
          responseData.result.status &&
          responseData.result.status !== 'left' &&
          responseData.result.status !== 'kicked'
        ) {
          user.completedTasks.push(task);

          await transactionalEntityManager.update(User, { tgId: user.tgId }, {
            balance: () => `balance + ${task.rewardAmount}`,
            score: () => `score + ${task.rewardAmount}`
          });

          io.emit('reward', task.rewardAmount);

          await transactionalEntityManager.save(user);

          io.emit('taskStatus', { id: task.id, finished: true });
        } else {
          io.emit('taskStatus', { id: task.id, finished: false });
          throw new Error('User is not in the required Telegram chat.');
        }
      } else {
        user.completedTasks.push(task);

        await transactionalEntityManager.update(User, { tgId: user.tgId }, {
          balance: () => `balance + ${task.rewardAmount}`,
          score: () => `score + ${task.rewardAmount}`
        });

        io.emit('reward', task.rewardAmount);

        await transactionalEntityManager.save(user);

        io.emit('taskStatus', { id: task.id, finished: true });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  });
};
