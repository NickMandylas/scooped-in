import "dotenv/config";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { Redis, Database, Constants } from "utils";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
    tableName: "migrations",
    transactional: true,
  },
  ...Database.Profiles.connect(),
  tsNode: Constants.__prod__ ? false : true,
  entities: ["./dist/entities/**/*.js"],
  entitiesTs: ["./src/entities/**/*.ts"],
  type: "postgresql",
  debug: Constants.__dev__,
  resultCache: {
    adapter: Database.RedisCacheAdapter,
    options: { expiration: 1000, client: Redis() },
  },
  cache: {
    adapter: Database.RedisCacheAdapter,
    options: { client: Redis() },
  },
} as Parameters<typeof MikroORM.init>[0];
