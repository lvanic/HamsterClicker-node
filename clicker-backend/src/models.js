import { mongoose } from "mongoose";

const businessUpgradeSchema = new mongoose.Schema({
  businessId: String,
  level: Number,
});
const userSchema = new mongoose.Schema({
  tgId: Number,
  tgUsername: String,
  firstName: String,
  lastName: String,
  balance: { type: Number, min: 0},
  score: { type: Number, min: 0},
  energy: { type: Number, min: 0, max: 1000},
  connectedWallet: String,
  lastDailyRewardTimestamp: Number,
  lastFullEnergyTimestamp: Number,
  fullEnergyActivates: Number,
  clickPower: Number,
  lastOnlineTimestamp: Number,
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  completedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  businesses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Business" }],
  businessUpgrades: [businessUpgradeSchema]
});
export const User = mongoose.model("User", userSchema);

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
  maxClickLevel: Number,
  startClickUpgradeCost: Number,
});
export const AppSettings = mongoose.model("AppSettings", appSettingsSchema);

const leagueSchema = new mongoose.Schema({
  name: String,
  description: String,
  avatarUrl: String,
  minScore: Number,
  maxScore: Number,
});
export const League = mongoose.model("League", leagueSchema);

const businessSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  avatarUrl: String,
  rewardPerHour: Number,
  refsToUnlock: Number,
  isDeleted: Boolean,
});
export const Business = mongoose.model("Business", businessSchema);