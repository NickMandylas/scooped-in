import { Creator } from "entities";
import { FastifyInstance } from "fastify";
import { app } from "..";

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

      const creator = em.create(Creator, {
        firstName,
        lastName,
        email,
        password,
      });

      await em.persistAndFlush(creator);

      reply.status(201).send({ creator });
    },
  );
  next();
}
