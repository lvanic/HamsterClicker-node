import { appDataSource } from "./core/database";
import { AppSettings } from "./models/appSettings";
import { Business } from "./models/business";
import { User } from "./models/user";
import { getAppSettings } from "./services/appSettingsService";

const ENERGY_UPDATE_INTERVAL_IN_SECOND = 1;
const COMBO_UPDATE_IN_SECOND = 60 * 60;

const updateCombos = async () => {
  try {
    const appSettings = await getAppSettings();

    const currentHours = new Date().getHours();
    if (
      appSettings.comboBusinesses.length !== 0 &&
      appSettings.lastComboUpdateTimestamp + 1000 * 60 * 60 * 24 > new Date().getTime() &&
      currentHours >= appSettings.comboUpdateDayHour
    ) {
      return;
    }

    const businesses = await appDataSource.getRepository(Business).find({
      where: {
        isDeleted: false,
      },
    });

    if (businesses.length < 3) {
      return;
    }
    const randomIndexes: number[] = [];

    while (true) {
      const randomIndex = Math.floor(Math.random() * businesses.length);
      if (!randomIndexes.includes(randomIndex)) {
        randomIndexes.push(randomIndex);
      } else {
        continue;
      }
      console.info("Updating combos...", new Date().getDate());

      if (randomIndexes.length === 3) {
        break;
      }
    }

    appSettings.comboBusinesses = [
      businesses[randomIndexes[0]],
      businesses[randomIndexes[1]],
      businesses[randomIndexes[2]],
    ];
    appSettings.lastComboUpdateTimestamp = Date.now();
    await appDataSource.getRepository(AppSettings).save(appSettings);
    await appDataSource
      .getRepository(User)
      .createQueryBuilder()
      .update()
      .set({
        currentComboCompletions: [],
      })
      .execute();
  } catch {
    console.log("error update combo");
  }
};

export const runCombos = () => {
  updateCombos();
  setInterval(updateCombos, COMBO_UPDATE_IN_SECOND * 1000);
};
