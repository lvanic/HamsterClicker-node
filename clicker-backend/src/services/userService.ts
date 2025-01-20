import { DeepPartial } from "typeorm";
import { appDataSource } from "../core/database"
import { User } from "../models/user"

const userRepository = appDataSource.getRepository(User);

export const findAllUsers = async (): Promise<User[]> => {
  const users = await userRepository.find();

  return users;
}

export const findUserByTgId = (tgId: number): Promise<User | null> => {
  return userRepository.findOneBy({tgId});
};

// TODO: get rid of DeepPartial
export const createUser = (userData: DeepPartial<User>): Promise<User> => {
  const user = userRepository.create(userData);

  return userRepository.save(user);
}

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