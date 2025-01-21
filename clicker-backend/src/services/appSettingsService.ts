import { DeepPartial } from "typeorm";
import { appDataSource } from "../core/database";
import { AppSettings } from "../models/appSettings";
import { DEFAULT_APP_SETTINGS } from "../core/constants";

const appSettingsRepository = appDataSource.getRepository(AppSettings);

export const getAppSettings = async(): Promise<AppSettings> => {
  const appSettings = await appSettingsRepository.find({ take: 1 });
  const firstAppSetting = appSettings[0]; // Get the first item
  
  return firstAppSetting;
};

export const getAppSettingsWithBusinesses = async (): Promise<AppSettings> => {
  const appSettings = await appSettingsRepository.find({
    take: 1,
    relations: {
      comboBusinesses: true,
    },
  });

  return appSettings[0];
};

// TODO: add validation
export const createAppSettings = (appSettingsData: DeepPartial<AppSettings>): Promise<AppSettings> => {
  const appSettings = appSettingsRepository.create(appSettingsData);

  return appSettingsRepository.save(appSettings);
};

// TODO: logging
export const initializeAppSettingsIfNotExists = async (): Promise<void> => {
  try {
    const isAppSettingsExists = await appSettingsRepository.exists({});

    if (!isAppSettingsExists) {
      await appSettingsRepository.save(DEFAULT_APP_SETTINGS);
    }
  } catch (error) {
    throw error;
  }
};
