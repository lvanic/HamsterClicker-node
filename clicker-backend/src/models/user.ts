import { Min } from "class-validator";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, Tree, TreeChildren, TreeParent } from "typeorm";
import { Business } from "./business";
import { Task } from "./task";
import { BusinessUpgrade } from "./businessUpgrade";
import { League } from "./league";

@Entity()
@Tree("closure-table")
export class User {
  @PrimaryColumn()
  tgId: number

  @Column()
  tgUsername: string

  @Column()
  firstName: string

  @Column({ nullable: true })
  lastName: string

  @Column()
  @Min(0)
  addedFromBusinesses: number

  @Column({nullable: true})
  @Min(0)
  addedEnergy: number

  @Column()
  balance: number

  @Column()
  @Min(0)
  score: number

  @Column()
  energy: number

  @Column({nullable: true})
  connectedWallet: string

  @Column({nullable: true})
  lastDailyRewardTimestamp: number

  @Column({nullable: true})
  lastFullEnergyTimestamp: number

  @Column({nullable: true})
  fullEnergyActivates: number

  @Column()
  clickPower: number

  @Column()
  energyLevel: number

  @Column()
  lastOnlineTimeStamp: number

  @ManyToMany(() => Business)
  @JoinTable()
  currentComboCompletions: Business[]

  @TreeChildren()
  referrals: User[]

  @ManyToMany(() => Task)
  @JoinTable()
  completedTasks: Task[]

  @ManyToMany(() => Business)
  @JoinTable()
  businesses: Business[]

  @TreeParent()
  parent: User

  @OneToMany(() => BusinessUpgrade, upgrade => upgrade.user)
  businessUpgrades: BusinessUpgrade[]

  @ManyToOne(() => League, { nullable: true })
  league: League;
}
