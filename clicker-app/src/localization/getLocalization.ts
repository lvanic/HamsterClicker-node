import en from "./en.json";
import zh from "./zh.json";

const translations = { en, zh };

export function getLocalization(key: string) {  
  const language = localStorage.getItem("language") || "en";

  //@ts-ignore
  const data = translations[language];

  return data[key] || key;
}
