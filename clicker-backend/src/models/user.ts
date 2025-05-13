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
import { Payment } from "./payment";

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

  @ManyToOne(() => Payment, (payment) => payment.user, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @Column({ default: false })
  isHandicapActive: boolean = false;
  @Column({ default: 0 })
  handicapExpiresAt: number = 0;

  @Column({ default: false })
  isX2Active: boolean = false;
  @Column({ default: 0 })
  x2ExpiresAt: number = 0;

  @ManyToOne(() => User, (user) => user.referrals, { nullable: true })
  parent: User;

  @OneToMany(() => BusinessUpgrade, (upgrade) => upgrade.user)
  businessUpgrades: BusinessUpgrade[];

  @Column({ default: 1 })
  private _level: number;

  get level(): number {
    return calculateLevel(this.score);
  }

  @Column({ default: 0 })
  scoreLastDay: number;

  @Column({ default: 0 })
  lastX2FreeUsedAt: number;
  @Column({ default: 0 })
  handicapUsedCount: number;
  @Column({ default: 0 })
  X2UsedCount: number;
  @Column({ default: 0 })
  lastX2UsedAt: number;
  @Column({ default: 0 })
  lastHandicapUsedAt: number;

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

function calculateLevel(score: number): number {
  if (score < 100000) return 1;
  if (score < 300000) return 2;
  if (score < 600000) return 3;
  if (score < 1000000) return 4;
  if (score < 1500000) return 5;
  if (score < 2100000) return 6;
  if (score < 2800000) return 7;
  if (score < 3600000) return 8;
  if (score < 4500000) return 9;
  if (score < 5500000) return 10;
  if (score < 6600000) return 11;
  if (score < 7800000) return 12;
  if (score < 9100000) return 13;
  if (score < 10500000) return 14;
  if (score < 12000000) return 15;
  if (score < 13600000) return 16;
  if (score < 15300000) return 17;
  if (score < 17100000) return 18;
  if (score < 19000000) return 19;
  if (score < 21000000) return 20;
  if (score < 23100000) return 21;
  if (score < 25300000) return 22;
  if (score < 27600000) return 23;
  if (score < 30000000) return 24;
  if (score < 32500000) return 25;
  if (score < 35100000) return 26;
  if (score < 37800000) return 27;
  if (score < 40600000) return 28;
  if (score < 43500000) return 29;
  if (score < 46500000) return 30;
  if (score < 49600000) return 31;
  if (score < 52800000) return 32;
  if (score < 56100000) return 33;
  if (score < 59500000) return 34;
  if (score < 63000000) return 35;
  if (score < 66600000) return 36;
  if (score < 70300000) return 37;
  if (score < 74100000) return 38;
  if (score < 78000000) return 39;
  if (score < 82000000) return 40;
  if (score < 86100000) return 41;
  if (score < 90300000) return 42;
  if (score < 94600000) return 43;
  if (score < 99000000) return 44;
  if (score < 103500000) return 45;
  if (score < 108100000) return 46;
  if (score < 112800000) return 47;
  if (score < 117600000) return 48;
  if (score < 122500000) return 49;
  if (score < 127500000) return 50;
  if (score < 132600000) return 51;
  if (score < 137800000) return 52;
  if (score < 143100000) return 53;
  if (score < 148500000) return 54;
  if (score < 154000000) return 55;
  if (score < 159600000) return 56;
  if (score < 165300000) return 57;
  if (score < 171100000) return 58;
  if (score < 177000000) return 59;
  if (score < 183000000) return 60;
  if (score < 189100000) return 61;
  if (score < 195300000) return 62;
  if (score < 201600000) return 63;
  if (score < 208000000) return 64;
  if (score < 214500000) return 65;
  if (score < 221100000) return 66;
  if (score < 227800000) return 67;
  if (score < 234600000) return 68;
  if (score < 241500000) return 69;
  if (score < 248500000) return 70;
  if (score < 255600000) return 71;
  if (score < 262800000) return 72;
  if (score < 270100000) return 73;
  if (score < 277500000) return 74;
  if (score < 285000000) return 75;
  if (score < 292600000) return 76;
  if (score < 300300000) return 77;
  if (score < 308100000) return 78;
  if (score < 316000000) return 79;
  if (score < 324000000) return 80;
  if (score < 332100000) return 81;
  if (score < 340300000) return 82;
  if (score < 348600000) return 83;
  if (score < 357000000) return 84;
  if (score < 365500000) return 85;
  if (score < 374100000) return 86;
  if (score < 382800000) return 87;
  if (score < 391600000) return 88;
  if (score < 400500000) return 89;
  if (score < 409500000) return 90;
  if (score < 418600000) return 91;
  if (score < 427800000) return 92;
  if (score < 437100000) return 93;
  if (score < 446500000) return 94;
  if (score < 456000000) return 95;
  if (score < 465600000) return 96;
  if (score < 475300000) return 97;
  if (score < 485100000) return 98;
  if (score < 495000000) return 99;
  return 100;
}
