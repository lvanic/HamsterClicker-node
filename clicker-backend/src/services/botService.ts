import { bot } from "../bot/bot";
import logger from "../core/logger";
import { findAllUsers } from "./userService";

export const sendForAllUsers = async (message: string) => {
  try {
    const users = await findAllUsers();
    for (const user of users) {
      try {
        await bot.telegram.sendMessage(user.tgId, message);
      } catch (error) {
        logger.error(`Failed to send message to user ${user.tgId}:`, error);
      }
    }
    logger.info("Broadcast message sent to all users.");
  } catch (error) {
    logger.error("Error sending broadcast to users:", error);
  }
};
