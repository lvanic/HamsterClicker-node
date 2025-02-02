import { Min } from "class-validator";
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Business } from "./business";
import { Task } from "./task";
import { BusinessUpgrade } from "./businessUpgrade";

@Entity()
export class User {
  @PrimaryColumn()
  tgId: number;

  @Column({ nullable: true })
  tgUsername: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column()
  @Min(0)
  addedFromBusinesses: number;

  @Column({ nullable: true })
  @Min(0)
  addedEnergy: number;

  @Column()
  balance: number;

  @Column()
  @Min(0)
  score: number;

  @Column()
  energy: number;

  @Column({ nullable: true })
  connectedWallet: string;

  @Column({ nullable: true })
  lastDailyRewardTimestamp: number;

  @Column({ nullable: true })
  lastFullEnergyTimestamp: number;

  @Column({ default: 0 })
  fullEnergyActivates: number;

  @Column()
  clickPower: number;

  @Column()
  energyLevel: number;

  @Column()
  lastOnlineTimeStamp: number;

  @ManyToMany(() => Business)
  @JoinTable()
  currentComboCompletions: Business[];

  @OneToMany(() => User, (user) => user.parent)
  referrals: User[];

  @ManyToMany(() => Task)
  @JoinTable()
  completedTasks: Task[];

  @ManyToMany(() => Business)
  @JoinTable()
  businesses: Business[];

  @ManyToOne(() => User, (user) => user.referrals, { nullable: true })
  parent: User;

  @OneToMany(() => BusinessUpgrade, (upgrade) => upgrade.user)
  businessUpgrades: BusinessUpgrade[];

  @Column({ default: 1 })
  level: number;
}

@Entity()
export class UserClosure {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  ancestor: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  descendant: User;

  @Column()
  depth: number;
}
