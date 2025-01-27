import { appDataSource } from "../core/database";
import { Business } from "../models/business";

const businessesRepository = appDataSource.getRepository(Business);

export const getNotDeletedBusinesses = (): Promise<Business[]> => {
  const businesses = businessesRepository.findBy({
    isDeleted: false
  });

  return businesses;
};