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
  minScore: string

  @Column()
  maxScore: string
}