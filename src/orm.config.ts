import "dotenv/config";
import path from "path";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
    tableName: "migrations",
    transactional: true,
  },
  user: "postgres",
  password: "postgres",
  dbName: "scoopedin",
  host: "localhost",
  port: 5432,
  tsNode: !__prod__,
  entities: ["./dist/entities/**/*.js"],
  entitiesTs: ["./src/entities/**/*.ts"],
  type: "postgresql",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
