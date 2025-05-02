interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export const getTelegramUser = (): TelegramUser => {
  if (typeof window.Telegram.WebApp !== "undefined") {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;

    if (user) {
      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
      };
    }
  }
  return {
    id: -1,
    first_name: "Telegram doesn't respond",
    last_name: "",
    username: "user.username",
    photo_url: "/img/default-avatar.png",
  };
};

export const getPlatform = () => {
  return window.Telegram.WebApp.platform;
};

export const getReferralLink = () => {
  const user = window.Telegram.WebApp.initDataUnsafe?.user;
  const botLink = process.env.REACT_APP_BOT_LINK;
  if (user && botLink) {
    return `${botLink}/?start=ref_${user.id}`;
  }
  return `You are not logged in`;
};

export const getShareLink = () => {
  const shareLink = process.env.REACT_APP_SHARE_LINK;
  const shareText = process.env.REACT_APP_SHARE_TEXT;
  return `${shareLink}url=${getReferralLink()}&text=${shareText}`;
};

export const webAppVibrate = () => {
  if (typeof window.Telegram.WebApp !== "undefined") {
    window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
  }
};
