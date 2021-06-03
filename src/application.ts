import ormConfig from "./orm.config";
import { Connection, IDatabaseDriver, MikroORM } from "@mikro-orm/core";
import { IncomingMessage, Server, ServerResponse } from "http";
import { console_prefix, __prod__ } from "./constants";
import fastifyCookie from "fastify-cookie";
import fastifyCors from "fastify-cors";
import fastifySession from "fastify-session";
import connectRedis from "connect-redis";
import { RedisClient } from "redis";
import redis from "utils/redis";
import {
  fastify,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

export default class Application {
  public orm: MikroORM<IDatabaseDriver<Connection>>;
  public host: FastifyInstance<Server, IncomingMessage, ServerResponse>;

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
        `${console_prefix} ERROR – Unable to connect to database!`,
        error,
      );
      throw Error(error);
    }
  };

  /*
   *
   * Method - Init
   * @description Fastify initialisation.
   * @return Promise<void>
   *
   */
  public init = async (): Promise<void> => {
    this.host = fastify({
      logger: {
        prettyPrint: true,
      },
      trustProxy: __prod__ ? 1 : 0,
    });

    this.host.register(fastifyCors, { origin: true, credentials: true }); // TODO - Fix this for multiple targets.
    this.host.register(fastifyCookie);

    const redisStore = connectRedis(fastifySession as any);
    const store = new redisStore({
      client: redis() as unknown as RedisClient,
    });

    this.host.register(fastifySession, {
      store,
      cookieName: "qid",
      secret: process.env.SECRET!,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        domain: __prod__ ? ".getscooped.in" : "",
        secure: __prod__,
        maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years
      },
    });

    this.host.decorateRequest("userId", "");

    this.host.decorate(
      "creatorAuth",
      (request: FastifyRequest, reply: FastifyReply, done: any) => {
        const id = request.session.creatorId;
        if (!id) {
          reply.status(401).send({
            field: "Unauthorised",
            message: "Unauthorised access for requested route.",
          });
          return;
        }
        request.userId = id;
        done();
      },
    );

    this.host.decorate(
      "watcherAuth",
      (request: FastifyRequest, reply: FastifyReply, done: any) => {
        const id = request.session.watcherId;
        if (!id) {
          reply.status(401).send({
            field: "Unauthorised",
            message: "Unauthorised access for requested route.",
          });
          return;
        }
        request.userId = id;
        done();
      },
    );

    this.host.register(require("./routes/creator"));
    this.host.register(require("./routes/watcher"));
    this.host.register(require("./routes/profile"));

    try {
      const PORT = process.env.PORT || 4000;
      await this.host
        .listen(PORT, "0.0.0.0")
        .then((address) =>
          console.log(`${console_prefix} Launched! Listening on ${address}`),
        );
    } catch (err) {
      this.host.log.error(err);
      process.exit(1);
    }
  };
}
