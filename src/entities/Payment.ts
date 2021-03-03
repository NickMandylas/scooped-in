import {
  Entity,
  JsonType,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { v4 } from "uuid";
import { Creator } from "./Creator";
import { Watcher } from "./Watcher";

@Entity()
export class Payment {
  @PrimaryKey({ type: "uuid" })
  id: string = v4();

  @ManyToOne()
  creator: Creator;

  @ManyToOne()
  watcher: Watcher;

  @Property({ type: "text" })
  chargeId: string;

  @Property({ type: "number" })
  amount: number;

  @Property({ type: JsonType })
  card: {
    brand: string;
    exp_month: string;
    exp_year: string;
    last4: string;
  };

  @Property({ type: "text" }) // TODO - Convert to enum
  status = "completed";

  @Property({ type: "date" })
  createdAt = new Date();
}
