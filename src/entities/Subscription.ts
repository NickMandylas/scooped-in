import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";
import { Creator } from "./Creator";
import { Watcher } from "./Watcher";

@Entity()
export class Subscription {
  @PrimaryKey({ type: "uuid" })
  id: string = v4();

  @ManyToOne({ entity: () => Creator })
  creator: Creator;

  @ManyToOne({ entity: () => Watcher })
  watcher: Watcher;

  @Property({ type: "data" })
  expiration: Date;

  @Property({ type: "text" }) // TODO - Convert to enum
  status = "active";

  @Property({ type: "date" })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), type: "date" })
  updatedAt = new Date();
}
