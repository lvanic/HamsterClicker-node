import { mongoose } from "mongoose";

const userSchema = new mongoose.Schema({
  tgId: Number,
  avatarUrl: String,
  tgUsername: String,
  firstName: String,
  lastName: String,
  balance: { type: Number, min: 0},
  energy: { type: Number, min: 0, max: 1000},
  lastOnlineTimestamp: Number,
  connectedWallet: String,
  lastDailyRewardTimestamp: Number,
  lastFullEnergyTimestamp: Number,
  fullEnergyActivates: Number,
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  completedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
});
export const User = mongoose.model("User", userSchema);

const clickSchema = new mongoose.Schema({
  user: userSchema,
  timestamp: Number,
  position: { x: Number, y: Number },
});
export const Click = mongoose.model("Click", clickSchema);

const taskSchema = new mongoose.Schema({
  rewardAmount: Number,
  avatarUrl: String,
  name: String,
  description: String,
  active: Boolean,
  type: String,
  activateUrl: String,
});
export const Task = mongoose.model("Task", taskSchema);

const appSettingsSchema = new mongoose.Schema({
  energyPerSecond: Number,
  rewardPerClick: Number,
  fullEnergyBoostPerDay: Number,
  dailyReward: Number,
  referralReward: Number,
});
export const AppSettings = mongoose.model("AppSettings", appSettingsSchema);

const leagueSchema = new mongoose.Schema({
  name: String,
  description: String,
  avatarUrl: String,
  minBalance: Number,
  maxBalance: Number,
});
export const League = mongoose.model("League", leagueSchema);

const businessSchema = new mongoose.Schema({
  name: String,
  description: String,
  avatarUrl: String,
  rewardPerHour: Number,
  isDeleted: Boolean,
});
export const Business = mongoose.model("Business", businessSchema);