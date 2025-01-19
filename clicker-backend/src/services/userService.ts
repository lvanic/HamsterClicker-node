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