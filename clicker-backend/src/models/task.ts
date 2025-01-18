import { Column } from "typeorm"

export class Task {
  @Column()
  rewardAmount: number

  @Column()
  avatarUrl: string
  
  @Column()
  name: string

  @Column()
  description: string

  @Column()
  active: boolean

  @Column()
  type: string

  @Column()
  activateUrl: string
}