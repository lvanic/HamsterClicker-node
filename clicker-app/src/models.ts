export interface User {
  tgId: number;
  avatarUrl: string;
  firstName: string;
  tgUsername: string;
  balance: number;
  energy: number;
  referrals: User[];
  completedTasks: Task[];
  lastDailyRewardTimestamp: number;
  lastFullEnergyTimestamp: number;
  fullEnergyActivates: number;
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
}

export interface League {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  minBalance: number;
  maxBalance: number;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  rewardPerHour: number;
  refsToUnlock: number;
  price: number;
}