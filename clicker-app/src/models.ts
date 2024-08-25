export interface User {
  tgId: number;
  firstName: string;
  tgUsername: string;
  balance: number;
  score: number;
  energy: number;
  referrals: User[];
  completedTasks: Task[];
  lastDailyRewardTimestamp: number;
  lastFullEnergyTimestamp: number;
  fullEnergyActivates: number;
  league: League;
  userPlaceInLeague: number;
  businesses: Business[];
  clickPower: number;
  totalIncomePerHour: number;
  userLevel: number;
  maxLevel: number;
  energyLevel: number;
  maxEnergy: number;
  currentComboCompletions: string[];
  cachedIncome: number;
  lastOnlineTimestamp: number;
}

export interface Task {
  id: string;
  rewardAmount: number;
  avatarUrl: string;
  name: string;
  description: string;
  active: boolean;
  type: string;
  activaterUrl: string;
  completed: boolean | undefined;
}

export interface League {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  minScore: number;
  maxScore: number;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  rewardPerHour: number;
  refsToUnlock: number;
  price: number;
  level: number;
  lastUpgradeTimestamp: number;
  category: string;
}

export interface Settings {
  energyPerSecond: number;
  rewardPerClick: number;
  fullEnergyBoostPerDay: number;
  dailyReward: number;
  referralReward: number;
  startClickUpgradeCost: number;
  maxClickLevel: number;
  startEnergyUpgradeCost: number;
  maxEnergyLevel: number;
  comboUpdateDayHour: number;
  comboReward: number;
  premiumReferralReward: number;
}
