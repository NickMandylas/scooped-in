import {
  Collection,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryKey,
  PrimaryKeyType,
  Property,
} from "@mikro-orm/core";
import { v4 } from "uuid";
import { Payment } from "./Payment";
import { Profile } from "./Profile";
import { Subscription } from "./Subscription";

@Entity()
export class Creator {
  @PrimaryKey({ type: "uuid" })
  id: string = v4();

  @Property({ type: "text" })
  firstName: string;

  @Property({ type: "text" })
  lastName: string;

  @Property({ type: "text", unique: true })
  email: string;

  @Property({ type: "text" })
  password: string;

  @Property({ type: "text", nullable: true })
  avatar: string;

  @Property({ type: "boolean" })
  confirmed = false;

  @Property({ type: "text" }) // TODO - Change to enum
  status = "Verification";

  @Property({ type: "date" })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), type: "date" })
  updatedAt = new Date();

  @OneToOne({ nullable: true })
  profile: Profile;

  @OneToMany(() => Subscription, (subscription) => subscription.creator)
  subscriptions = new Collection<Subscription>(this);

  @OneToMany(() => Payment, (payment) => payment.creator)
  payments = new Collection<Payment>(this);

  [PrimaryKeyType]: [string];
}
