import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()

export class League {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column()
  description: string

  @Column()
  avatarUrl: string

  @Column()
  minScore: number

  @Column()
  maxScore: number
}