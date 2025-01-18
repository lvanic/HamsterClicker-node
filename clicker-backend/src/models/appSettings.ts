import { Column, JoinTable, ManyToMany } from "typeorm";
import { Business } from "./business.js";

export class AppSettings {
  @Column()
  energyPerSecond: number

  @Column()
  rewardPerClick: number

  @Column()
  fullEnergyBoostPerDay: number

  @Column()
  dailyReward: number

  @Column()
  referralReward: number

  @Column()
  premiumReferralReward: number

  @Column()
  maxClickLevel: number
  startClickUpgradeCost: number
  maxEnergyLevel: number
  startEnergyUpgradeCost: number
  comboReward: number
  comboUpdateDayHour: number
  lastComboUpdateTimestamp: number

  @ManyToMany(() => Business)
  @JoinTable()
  comboBusinesses: Business[]
}