import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number

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