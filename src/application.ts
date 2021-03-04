import * as Fastify from "fastify";
import ormConfig from "./orm.config";
import { Connection, IDatabaseDriver, MikroORM } from "@mikro-orm/core";
import { IncomingMessage, Server, ServerResponse } from "http";
import { console_prefix, __prod__ } from "./constants";

export default class Application {
  public orm: MikroORM<IDatabaseDriver<Connection>>;
  public host: Fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>;

  /*
   *
   * Method - Connect
   * @description MikroORM establishes conneciton to DB.
   * @return Promise<void>
   *
   */
  public connect = async (): Promise<void> => {
    try {
      this.orm = await MikroORM.init(ormConfig);
      const migrator = this.orm.getMigrator();
      const migrations = await migrator.getPendingMigrations();
      if (migrations && migrations.length > 0) {
        await migrator.up();
      }
    } catch (error) {
      console.log(
        `${console_prefix} ❌ ERROR – Unable to connect to database!`,
        error,
      );
      throw Error(error);
    }
  };

  /*
   *
   * Method - Init
   * @description Fastify & Mercurius initialisation.
   * @return Promise<void>
   *
   */
  public init = async (): Promise<void> => {
    this.host = Fastify.fastify({
      logger: !__prod__,
      trustProxy: __prod__ ? 1 : 0,
    });

    this.host.register(require("./routes/creator"));

    try {
      const PORT = process.env.PORT || 4000;
      await this.host
        .listen(PORT, "0.0.0.0")
        .then((address) =>
          console.log(`${console_prefix} 🚀 Launched! Listening on ${address}`),
        );
    } catch (err) {
      this.host.log.error(err);
      process.exit(1);
    }
  };
}
