import fs from "fs";
import path from "path";

const loadTranslations = (lang) => {
  const filePath = path.join(__dirname, `${lang}.json`);

  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
    return {};
  }
};

const translations = {
  en: loadTranslations("en"),
  zh: loadTranslations("zh"),
};

export const getLang = (lang, word) => {
  const localized = translations[lang || "en"];
  return localized ? localized[word] || word : word;
};
