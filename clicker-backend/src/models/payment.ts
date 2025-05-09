// payment.ts
import { Entity, Column, PrimaryColumn, ManyToOne } from "typeorm";
import { User } from "./user"; // убедись, что путь правильный

export type ServiceType = 'boost_x2' | 'handicap';

@Entity()
export class Payment {
  @PrimaryColumn()
  uuid: string;

  @Column("integer")
  amount: number; // nanoTON

  @Column()
  serviceType: ServiceType;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: false })
  used: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })//nullable: true just for dev
  user: User;
}
