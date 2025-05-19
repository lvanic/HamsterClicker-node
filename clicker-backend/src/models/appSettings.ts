import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Business } from "./business";

@Entity()
export class AppSettings {
  @PrimaryGeneratedColumn()
  id: number

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

  @Column()
  startClickUpgradeCost: number

  @Column()
  maxEnergyLevel: number

  @Column()
  startEnergyUpgradeCost: number

  @Column()
  comboReward: number

  @Column()
  comboUpdateDayHour: number

  @Column()
  lastComboUpdateTimestamp: number

  @ManyToMany(() => Business)
  @JoinTable()
  comboBusinesses: Business[]

  @Column({ default: false })
  isRewardForReferalActive: boolean

  @Column({ default: 0, nullable: true })
  referralTaskEndsAt: number

  @Column({ default: 0, nullable: true })
  newRefferalsToActivate: number

  @Column({ default: 0 })
  lastTaskAddedAt: number
}