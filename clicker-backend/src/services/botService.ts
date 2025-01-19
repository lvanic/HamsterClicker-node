import { bot } from "../bot";
import { findAllUsers } from "./userService";

export const sendForAllUsers = async (message: string) => {
  try {
    const users = await findAllUsers();
    for (const user of users) {
      try {
        await bot.telegram.sendMessage(user.tgId, message);
      } catch (error) {
        console.error(`Failed to send message to user ${user.tgId}:`, error);
      }
    }
    console.log("Broadcast message sent to all users.");
  } catch (error) {
    console.error("Error sending broadcast to users:", error);
  }
};