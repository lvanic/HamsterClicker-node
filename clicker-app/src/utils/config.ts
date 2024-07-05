import dotenv from "dotenv";

// dotenv.config();

interface Config {
  serverUrl: string;
  adminApiUrl: string;
  adminPassword: string;
  tgBotLink: string;
}

const config: Config = (function () {
  if (!process.env.REACT_APP_SERVER_URL) {
    throw new Error(
      "REACT_APP_SERVER_URL is not defined in the environment variables"
    );
  }

  if (!process.env.REACT_APP_ADMIN_API_URL) {
    throw new Error(
      "REACT_APP_ADMIN_API_URL is not defined in the environment variables"
    );
  }

  if (!process.env.REACT_APP_ADMIN_PASSWORD) {
    throw new Error(
      "REACT_APP_ADMIN_PASSWORD is not defined in the environment variables"
    );
  }

  if (!process.env.REACT_APP_BOT_LINK) {
    throw new Error(
      "REACT_APP_BOT_LINK is not defined in the environment variables"
    );
  }

  return {
    serverUrl: process.env.REACT_APP_SERVER_URL,
    adminApiUrl: process.env.REACT_APP_ADMIN_API_URL,
    adminPassword: process.env.REACT_APP_ADMIN_PASSWORD,
    tgBotLink: process.env.REACT_APP_BOT_LINK,
  } as Config;
})();

export const getConfig = (): Config => {
  return config;
};
