import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business } from "./business";
import { User } from "./user";

@Entity()
export class BusinessUpgrade {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => User, user => user.businessUpgrades)
  user: User;

  @ManyToOne(() => Business, business => business.upgrades)
  business: Business;

  @Column()
  level: number

  @Column()
  timestamp: number
}