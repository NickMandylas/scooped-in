import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { v4 } from "uuid";
import { Payment } from "./Payment";
import { Subscription } from "./Subscription";

@Entity()
export class Watcher {
  @PrimaryKey({ type: "uuid" })
  id: string = v4();

  @Property({ type: "text" })
  name: string;

  @Property({ type: "text", unique: true })
  email: string;

  @Property({ type: "text" })
  password: string;

  @Property({ type: "boolean" })
  confirmed = false;

  @Property({ type: "boolean" })
  banned = false;

  @Property({ type: "text", nullable: true, unique: true })
  instagramUUID: string;

  @Property({ type: "text", nullable: true })
  avatar: string;

  @Property({ type: "date" })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), type: "date" })
  updatedAt = new Date();

  @OneToMany(() => Subscription, (subscription) => subscription.watcher)
  subscriptions = new Collection<Subscription>(this);

  @OneToMany(() => Payment, (payment) => payment.watcher)
  payments = new Collection<Payment>(this);
}
