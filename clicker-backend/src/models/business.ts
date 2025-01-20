import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BusinessUpgrade } from "./businessUpgrade";

@Entity()
export class Business {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  description: string

  @Column()
  price: number

  @Column()
  avatarUrl: number

  @Column()
  rewardPerHour: number

  @Column()
  refsToUnlock: number

  @Column()
  isDeleted: boolean

  @Column()
  category: string

  @OneToMany(() => BusinessUpgrade, upgrade => upgrade.business)
  upgrades: BusinessUpgrade[];
}