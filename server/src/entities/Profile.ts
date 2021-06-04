import {
  Entity,
  JsonType,
  OneToOne,
  PrimaryKey,
  PrimaryKeyType,
  Property,
} from "@mikro-orm/core";
import { Creator } from "./Creator";

@Entity()
export class Profile {
  @PrimaryKey({ type: "uuid", persist: false })
  creatorId: string;

  @OneToOne({ entity: () => Creator, orphanRemoval: true })
  creator: Creator;

  @Property({ type: "text", unique: true })
  uuid: string;

  @Property({ type: JsonType, nullable: true })
  session: {
    cookies: string;
    state: {
      deviceString: string;
      deviceId: string;
      uuid: string;
      phoneId: string;
      adid: string;
      build: string;
    };
  };

  @Property({ type: "date" })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date(), type: "date" })
  updatedAt = new Date();

  [PrimaryKeyType]: [string];
}
