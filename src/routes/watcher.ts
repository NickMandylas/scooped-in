import argon2 from "argon2";
import { __prod__ } from "../constants";
import { FastifyInstance } from "fastify";
import { app } from "..";
import { Watcher } from "entities";
import { Instagram } from "instagram";

export default function (fastify: FastifyInstance, _: any, next: any): void {
  /*
   * WATCHER - POST: Register Endpoint
   */

  fastify.post<{
    Body: {
      name: string;
      email: string;
      password: string;
    };
  }>(
    "/watcher/register",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            firstName: { type: "string", minLength: 1, maxLength: 30 },
            lastName: { type: "string", minLength: 1, maxLength: 30 },
            email: { type: "string", format: "email" },
            password: {
              type: "string",
              format: "regex",
              minLength: 6,
              maxLength: 20,
            },
          },
          required: ["firstName", "lastName", "email", "password"],
        },
      },
    },
    async (request, reply) => {
      const em = app.orm.em;

      const { name, email, password } = request.body;

      const emailInUse = await em
        .findOne(Watcher, { email })
        .then((watcher) => {
          if (watcher) return true;
          return false;
        });

      if (emailInUse) {
        reply.status(400).send({
          field: "email",
          message: "Email is currently being used by another account.",
        });
        return;
      }

      const hashedPassword = await argon2.hash(password);

      const watcher = em.create(Watcher, {
        name,
        email,
        confirmed: __prod__ ? false : true,
        password: hashedPassword,
      });

      await em.persistAndFlush(watcher);

      reply.status(201).send({ watcher });
    },
  );

  /*
   * WATCHER - POST: Login Endpoint
   */

  fastify.post<{
    Body: {
      email: string;
      password: string;
    };
  }>(
    "/watcher/login",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "regex" },
          },
          required: ["email", "password"],
        },
      },
    },
    async (request, reply) => {
      const em = app.orm.em;
      const { email, password } = request.body;

      const watcher = await em.findOne(Watcher, { email });

      if (watcher) {
        const valid = await argon2.verify(watcher.password, password);

        if (valid && watcher.confirmed) {
          request.session.creatorId = watcher.id;
          reply.send({ id: watcher.id, sessionStart: Date.now() });
          return;
        }
      }

      reply.status(400).send({
        field: "emailOrPassword",
        message: "Email or password provided is incorrect.",
      });
    },
  );

  /*
   * WATCHER - POST: Link Instagram
   */

  fastify.post<{
    Body: {
      email: string;
      password: string;
    };
  }>(
    "/watcher/link",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", format: "regex" },
          },
          required: ["email", "password"],
        },
      },
    },
    async (request, reply) => {
      const em = app.orm.em;
      const { email, password } = request.body;

      const watcher = await em.findOne(Watcher, { email });

      if (watcher) {
        const valid = await argon2.verify(watcher.password, password);

        if (valid && watcher.confirmed) {
          request.session.creatorId = watcher.id;
          reply.send({ id: watcher.id, sessionStart: Date.now() });
          return;
        }
      }

      reply.status(400).send({
        field: "emailOrPassword",
        message: "Email or password provided is incorrect.",
      });
    },
  );

  /*
   * CREATOR - POST: Link Instagram Endpoint
   */

  fastify.post<{
    Body: {
      username: string;
    };
  }>(
    "/creator/link",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            username: { type: "string", minLength: 1, maxLength: 60 },
          },
          required: ["username"],
        },
      },
    },
    async (request, reply) => {
      const em = app.orm.em;

      const { username } = request.body;

      const watcher = await em.findOne(Watcher, { id: request.userId });

      if (watcher) {
        const client = new Instagram(username);
        const uuid = await client.getAccountPk();

        if (uuid) {
          watcher.instagramUUID = uuid;
          await em.persistAndFlush(watcher);
          reply.status(200).send({
            linked: true,
            pk: uuid,
          });
        }

        reply.status(400).send({
          field: "username",
          message:
            "Could not find an instagram account with associated username.",
        });
      }

      reply.status(404).send({
        field: "watcher",
        message: "Watcher associated with account id, couldn't be found",
      });
    },
  );

  /*
   * WATCHER - GET: Watcher Endpoint
   */

  fastify.get(
    "/watcher",
    { preHandler: [fastify.watcherAuth] },
    async (request, reply) => {
      const em = app.orm.em;
      const watcher = await em.findOne(Watcher, {
        id: request.userId,
      });

      if (watcher) {
        reply.status(200).send({
          id: watcher.id,
          name: watcher.name,
          email: watcher.email,
          instagramUUID: watcher.instagramUUID,
          confirmed: watcher.confirmed,
          createdAt: watcher.createdAt,
        });
        return;
      }

      reply.status(404).send({
        field: "watcher",
        message: "Watcher associated with account id, couldn't be found",
      });
    },
  );

  next();
}
