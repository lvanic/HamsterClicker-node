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
//   connectedWallet: String,
