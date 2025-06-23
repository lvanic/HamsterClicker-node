import { Telegraf } from "telegraf";
import { config } from "../core/config";
import { createUser, findUserByTgId, updateUserByTgId } from "../services/userService";
import { getAppSettings } from "../services/appSettingsService";
import { appDataSource } from "../core/database";
import { User } from "../models/user";
import logger from "../core/logger";
import { app } from "../adminServer/app";

export const bot = new Telegraf(config.TG_BOT_TOKEN);

bot.start(async (ctx) => {
  try {
    const [, refId] = ctx.message.text.split("ref_");
    const tgUserId = ctx.message.chat.id;
    const appSettings = await getAppSettings();
    // TODO: proper error handling
    await ctx.reply(
      `
Hello, ${ctx.message.from.first_name || ctx.message.from.username}

Welcome to BUN!

Tap the screen and get BUN tokens.
Invite your friends and get even more BUN tokens.
We have a cool Airdrop promotion coming up in the future!
`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Website", url: "https://buntoken.pro" }],
            [{ text: "Channel", url: config.CHAN_URL }],
            [{ text: "Play", url: config.WEB_APP_URL }],
            [{ text: "Rules", url: "https://buntoken.pro/rules.html" }],
            [{ text: "Privacy Policy", url: "https://buntoken.pro/privacy-policy.html" }],
            [{ text: "Support", url: "https://t.me/BUN_support_bot" }],
          ],
        },
      },
    );

    // TODO: create separate function in service
    const isUserExist = !!(await findUserByTgId(tgUserId));

    if (!isUserExist) {
      logger.info("New user", {
        tgUserId,
        refId,
      });

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
        scoreLastDay: 0,
      });

     if (refId) {
  const refUser = await findUserByTgId(+refId);
  if (refUser) {
    if (appSettings.referralTaskEndsAt > new Date().getTime()) {
      refUser.newReferrals += 1;
      if (appSettings.newRefferalsToActivate === refUser.newReferrals) {
        refUser.balance += appSettings.referralReward;
        refUser.newReferrals = 0;
        refUser.isReferralTaskActive = false;
      }
    } else {
      refUser.isReferralTaskActive = false;
      refUser.newReferrals = 0;
    }
    await updateUserByTgId(+refId, refUser);
    user.parent = refUser;
  } else {
    logger.warn(`Ref user not found: ${refId}, parent will not be set`);
  }
}

      await createUser(user);
    }
  } catch (e) {
    logger.error("Error welcome bot", e);
  }
});

bot.action("rules", async (ctx) => {
  try {
    await ctx.reply(`**Terms and Conditions**

1. **Introduction**
Welcome to Hamster Verse! By using this app, you agree to these terms.

2. **Acceptance and Changes**
By accessing this app, you accept these terms. We may update them occasionally. Continued use means you agree to the updated terms.

3. **User Responsibilities**
You agree to use our services in compliance with all applicable laws and regulations.

4. **Prohibited Actions**
Avoid using automated systems or engaging in fraudulent activities that disrupt the service.

5. **Limitation of Liability**
We are not responsible for any damages or losses resulting from the use of our services.

6. **Termination**
You can stop using the service at any time. We also reserve the right to terminate your access at any time for any reason.

7. **Miscellaneous**
These terms are governed by the laws of Hong Kong and include the entire agreement between you and us.
  `);
  } catch (e) {
    logger.error("Error rules action", e);
  }
});
