import { Column } from "typeorm";

export class League {
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