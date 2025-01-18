import { Min } from "class-validator";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn, Tree, TreeChildren } from "typeorm";
import { Business } from "./business.js";
import { Task } from "./task.js";

@Entity()
@Tree("closure-table")
export class User {
  @PrimaryColumn()
  tgId: number

  @Column()
  tsUsername: string

  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column()
  @Min(0)
  addedFromBusinesses: number

  @Column()
  @Min(0)
  addedEnergy: number

  @Column()
  balance: number

  @Column()
  @Min(0)
  score: number

  @Column()
  energy: number

  @Column()
  connectedWallet: string

  @Column()
  lastDailyRewardTimestamp: number

  @Column()
  lastFullEnergyTimestamp: number

  @Column()
  fullEnergyActivates: number

  @Column()
  clickPower: number

  @Column()
  energyLevel: number

  @Column()
  lastOnlineTimestamp: number

  @ManyToMany(() => Business)
  @JoinTable()
  currentComboCompletions: Business[]

  @Column()
  @TreeChildren()
  referrals: User[]

  @ManyToMany(() => Task)
  @JoinTable()
  completedTasks: Task[]

  @ManyToMany(() => Business)
  @JoinTable()
  businesses: Business[]
}
