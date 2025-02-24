import fs from "fs";
import path from "path";
import logger from "./core/logger";

const loadTranslations = (lang: string) => {
  const filePath = path.join(__dirname, `${lang}.json`);

  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error loading translations for ${lang}:`, error);
    return {};
  }
};

const translations = {
  en: loadTranslations("en") as Record<string, string>,
  zh: loadTranslations("zh") as Record<string, string>,
};

export const getLang = (lang: keyof typeof translations, word: string) => {
  const localized = translations[lang || "en"];
  return localized ? localized[word] || word : word;
};
