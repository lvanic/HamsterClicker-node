import { User } from './models.js';

export const runEnergyRecover = () => {
  setInterval(async () => {
    const users = await User.find({ energy: { $lt: 1000 } });
    try {
      await Promise.all(users.map((user) => {
        return User.findOneAndUpdate({ tgId: user.tgId }, {
          $inc : { 'energy' : 1}
        });
      }));
    } catch {}
    console.log("Energy recovered for users:", users.map((user) => `${user.tgId}: ${user.energy}`).join('\n'));
  }, 5000);
}