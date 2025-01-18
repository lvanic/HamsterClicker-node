import { Column } from "typeorm";

export class Business {
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