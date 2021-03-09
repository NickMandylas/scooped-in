import { FastifyInstance } from "fastify";
import { Instagram } from "instagram";

export default function (fastify: FastifyInstance, _: any, next: any): void {
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
          required: ["username", "password"],
        },
      },
      preHandler: [fastify.creatorAuth],
    },
    async (request, reply) => {
      const { username } = request.body;

      const client = new Instagram(username);
      const valid = await client.getAccountPk();

      if (valid) {
        const auth = await client.authenticate(valid);

        if (auth.status === "authenticated") {
        } else if (auth.status === "twoFactorSent") {
        }

        reply.status(200).send({ valid: true });
        return;
      }

      reply.status(400).send({ valid: false });
    },
  );

  fastify.post<{ Body: { username: string; token: string } }>(
    "/profile/2fa",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            username: { type: "string" },
            token: { type: "string", minLength: 6, maxLength: 6 },
          },
          required: ["username", "token"],
        },
      },
      preHandler: [fastify.creatorAuth],
    },
    async (request, reply) => {
      const { username, token } = request.body;

      const client = new Instagram(username);
      const valid = await client.getAccountPk();

      if (valid) {
        const res = await client.twoFactorVerify(token);
        if (res.status === "linked") {
          reply.status(200).send({ valid: true });
          return;
        }
        reply.status(200).send({ valid: true });
        return;
      }

      reply.status(400).send({ valid: false });
    },
  );

  next();
}
