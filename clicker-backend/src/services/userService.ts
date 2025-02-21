import { DeepPartial } from "typeorm";
import { appDataSource } from "../core/database"
import { User, UserClosure } from "../models/user"

const userRepository = appDataSource.getRepository(User);

export const findAllUsers = async (): Promise<User[]> => {
  const users = await userRepository.find();

  return users;
}

export const findUserByTgId = (tgId: number): Promise<User | null> => {
  return userRepository.findOneBy({tgId});
};

// TODO: rewrite?
export const updateUserByTgId = async (tgId: number, userData: DeepPartial<User>): Promise<User> => {
  await userRepository.update(tgId, userData);
  return userRepository.findOneByOrFail({ tgId });
}

export const deleteUserByTgId = async (tgId: number): Promise<void> => {
  await userRepository.delete({ tgId });
};

export const findFullUserInfoByTgId = async (tgId: number): Promise<User> => {
  const user = await userRepository.findOne({ relations: {
    businesses: true,
    referrals: true,
    completedTasks: true,
    currentComboCompletions: true,
  }, where: {
    tgId
  } });

  // TODO: add proper error handling
  if (!user) {
    throw Error("");
  }

  return user;
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