import { DeepPartial } from "typeorm";
import { appDataSource } from "../core/database"
import { AppSettings } from "../models/appSettings";

const appSettingsRepository = appDataSource.getRepository(AppSettings);

export const getAllAppSettings = async (): Promise<AppSettings[]> => {
  const appSettings = appSettingsRepository.find();

  return appSettings;
};

export const getAppSettingsWithBusinesses = async (): Promise<AppSettings> => {
  const appSettings = await appSettingsRepository.findOneOrFail({
    relations: {
      comboBusinesses: true
    }
  });

  return appSettings;
};

export const createAppSettings = async (appSettingsData: DeepPartial<AppSettings>): Promise<AppSettings> => {
  const user = appSettingsRepository.create(appSettingsData);

  return appSettingsRepository.save(user);
};