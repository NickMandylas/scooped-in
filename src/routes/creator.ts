import argon2 from "argon2";
import { __prod__ } from "../constants";
import { Creator } from "entities";
import { FastifyInstance } from "fastify";
import { app } from "..";
import { Instagram } from "instagram";

export default function (fastify: FastifyInstance, _: any, next: any): void {
  fastify.post<{
    Body: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    };
  }>(
    "/creator/register",
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

      const { firstName, lastName, email, password } = request.body;

      const emailInUse = await em
        .findOne(Creator, { email })
        .then((creator) => {
          if (creator) return true;
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

      const creator = em.create(Creator, {
        firstName,
        lastName,
        email,
        confirmed: __prod__ ? false : true,
        password: hashedPassword,
      });

      await em.persistAndFlush(creator);

      reply.status(201).send({ creator });
    },
  );

  fastify.post<{
    Body: {
      email: string;
      password: string;
    };
  }>(
    "/creator/login",
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

      const creator = await em.findOne(Creator, { email });

      if (creator) {
        const valid = await argon2.verify(creator.password, password);

        if (valid && creator.confirmed) {
          reply.status(200).send(creator);
          return;
        }
      }

      reply.status(400).send({
        field: "emailOrPassword",
        message: "Email or password provided is incorrect.",
      });
    },
  );

  fastify.post<{ Body: { username: string; password: string } }>(
    "/profile/link",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            username: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { username } = request.body;

      const client = new Instagram(username);
      const valid = await client.getAccountPk();

      if (valid) {
        reply.status(200).send({ valid: true });
        return;
      }

      reply.status(400).send({ valid: false });
    },
  );

  next();
}
