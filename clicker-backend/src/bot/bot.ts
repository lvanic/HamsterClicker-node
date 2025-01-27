import { Telegraf } from "telegraf";
import { config } from "../core/config";
import { createUser, findUserByTgId, updateUserByTgId } from "../services/userService";
import { getAppSettingsWithBusinesses } from "../services/appSettingsService";
import { appDataSource } from "../core/database";
import { User } from "../models/user";

export const bot = new Telegraf(config.TG_BOT_TOKEN);

bot.start(async (ctx) => {
  try {
    const [, refId] = ctx.message.text.split("ref_");
    const tgUserId = ctx.message.chat.id;

    // TODO: proper error handling
    await ctx.reply("Welcome");

    // TODO: create separate function in service
    const isUserExist = !!(await findUserByTgId(tgUserId));

    if (!isUserExist) {
      const user = appDataSource.getRepository(User).create({
        tgId: tgUserId,
        tgUsername: ctx.message.from.username,
        firstName: ctx.message.from.first_name,
        lastName: ctx.message.from.last_name,
        balance: 0,
        score: 0,
        energy: 1000,
        // maxEnergy: 1000, TODO: check if this property needed
        clickPower: 1,
        energyLevel: 1,
        addedFromBusinesses: 0,
        addedEnergy: 0,
        lastOnlineTimeStamp: new Date().getTime(), // TODO: fix typo, should be lastOnlineTimestamp
      });

      if (refId) {
        const refUser = await findUserByTgId(+refId);
        user.parent = refUser!;
      }

      await createUser(user);
    }
  } catch (e){
    console.log("Error welcome bot", e);
    
  }
});
