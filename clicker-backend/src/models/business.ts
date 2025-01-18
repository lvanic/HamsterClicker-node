import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}