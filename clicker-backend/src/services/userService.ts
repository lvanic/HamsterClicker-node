import { DeepPartial } from "typeorm";
import { appDataSource } from "../core/database";
import { User, UserClosure } from "../models/user";
import logger from "../core/logger";
import { OFFLINE_REWARD_BASE } from "../core/constants";

const userRepository = appDataSource.getRepository(User);

export const findAllUsers = async (): Promise<User[]> => {
  const users = await userRepository.find();

  return users;
};

// a reward is calculated for each whole hour passed.
export const calculateUsersOfflineReward = (hoursOffline: number, level: number): number => {
  if (hoursOffline === 0) return 0;

  // recursively call the reward calculation function, with each hour the reward is divided by 2
  return (
    (OFFLINE_REWARD_BASE * level) / Math.pow(2, hoursOffline - 1) + calculateUsersOfflineReward(hoursOffline - 1, level)
  );
};

export const findUserByTgId = (tgId: number): Promise<User | null> => {
  return userRepository.findOneBy({ tgId });
};

export const findUserByTgIdWithRelations = (tgId: number, relations: string[]): Promise<User | null> => {
  try {
    return userRepository.findOne({ where: { tgId }, relations });
  } catch (error) {
    logger.error("Error while finding user in db", error);
    throw error;
  }
};

export const getUserByTgId = (tgId: number): Promise<User> => {
  try {
    return userRepository.findOneByOrFail({ tgId });
  } catch (error) {
    logger.error("Error while getting user from db", error);
    throw error;
  }
};

export const getUserPlaceInTop = async (userScore: number): Promise<number> => {
  try {
    const query = await appDataSource
      .getRepository(User)
      .createQueryBuilder("users")
      .select("COUNT(*) + 1", "rank")
      .where(`users.score > ${userScore}`);

    const userPlaceInTop = (query.getRawOne() as unknown as { rank?: number }).rank || 1;

    return userPlaceInTop;
  } catch (error) {
    logger.error("Error while getting user place in top", error);
    throw error;
  }
};

async updateUserByTgId(tgId: number, userData: Partial<User>) {
  const { completedTasks, ...plainUserData } = userData;

  if (Object.keys(plainUserData).length > 0) {
    await this.userRepository.update({ tgId }, plainUserData);
  }

  if (completedTasks) {
    const taskIds = completedTasks.map((task) => task.id);
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'completedTasks')
      .of(tgId)
      .add(taskIds);
  }
}

export const deleteUserByTgId = async (tgId: number): Promise<void> => {
  await userRepository.delete({ tgId });
};

export const createUser = async (entityData: DeepPartial<User>) => {
  const userRepository = appDataSource.getRepository(User);
  const userClosureRepository = appDataSource.getRepository(UserClosure);

  const user = await userRepository.save(entityData);

  // if (user.parent) {
  //   await userClosureRepository.query(`
  //     INSERT INTO user_closure (ancestorTgId, descendantTgId, depth)
  //       SELECT ancestorTgId, ${user.tgId}, depth + 1
  //       FROM user_closure
  //       WHERE descendantTgId = ${user.parent.tgId}
  //   `);

  //   const ancestors = await userClosureRepository.find({
  //     where: { descendant: { tgId: user.tgId } },
  //     relations: ["ancestor"],
  //   });

  //   for (const { ancestor } of ancestors) {
  //     const childrenFirstLevelCount = await userClosureRepository.count({
  //       where: {
  //         ancestor,
  //         depth: 1,
  //       },
  //     });

  //     const maxDepthLevel = (await userClosureRepository
  //       .createQueryBuilder("c")
  //       .select("c.depth")
  //       // .select("c.depth", "level")
  //       .where("c.ancestorTgId = :rootId", { rootId: ancestor.tgId })
  //       .andWhere("c.descendantTgId <> :rootId", { rootId: ancestor.tgId })
  //       .groupBy("c.depth")
  //       .having("COUNT(*) > 2")
  //       .orderBy("c.depth", "DESC")
  //       .getOne())?.depth || 1;

  //     if (ancestor.level === 1 && childrenFirstLevelCount >= 3) {
  //       console.log("level upgrade: ", 2);

  //       ancestor.level = 2;

  //       await userRepository.save(ancestor);
  //     }

  //     if (ancestor.level >= 2 && Math.max((Math.floor(childrenFirstLevelCount / 10) + 2), maxDepthLevel + 1) > ancestor.level) {
  //       console.log("level upgrade max: ", Math.max((Math.floor(childrenFirstLevelCount / 10) + 2), maxDepthLevel + 1));

  //       ancestor.level = Math.max((Math.floor(childrenFirstLevelCount / 10) + 2), maxDepthLevel + 1);
  //       await userRepository.save(ancestor);
  //     }
  //   }
  // }

  await userClosureRepository.insert({
    ancestor: user,
    descendant: user,
    depth: 0,
  });

  return user;
};
