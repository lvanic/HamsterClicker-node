import { DeepPartial } from "typeorm";
import { appDataSource } from "../core/database";
import { AppSettings } from "../models/appSettings";
import { DEFAULT_APP_SETTINGS } from "../core/constants";

const appSettingsRepository = appDataSource.getRepository(AppSettings);

export const getAppSettings = (): Promise<AppSettings> => {
  const appSettings = appSettingsRepository.findOneOrFail({});

  return appSettings;
};

export const getAppSettingsWithBusinesses = async (): Promise<AppSettings> => {
  const appSettings = await appSettingsRepository.findOneOrFail({
    relations: {
      comboBusinesses: true,
    },
  });

  return appSettings;
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
