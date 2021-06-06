import { FastifyInstance } from "fastify";
import { Instagram } from "services/instagram";

export default function (fastify: FastifyInstance, _: any, next: any): void {
  /*
   *
   * Profile Linking
   * /profile/link
   * /profile/auth (if already linked)
   * /profile/2fa - TODO: Fix for both auth & link
   *
   */

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
      const { username, password } = request.body;

      const client = new Instagram(username);
      const valid = await client.getAccountInfo();
      const profileInUse = await client.getProfileByCreator(request.userId);

      if (valid && !profileInUse) {
        const auth = await client.authenticate(password);

        if (auth.status === "authenticated") {
          const link = await client.linkAccount(request.userId);
          if (link) {
            reply.status(200).send({
              message: "Profile linked.",
            });
            return;
          }
        } else if (auth.status === "twoFactorSent") {
          reply
            .status(200)
            .send({ message: "Two factor authentication required." });
          return;
        }

        reply.status(400).send({ message: auth.status });
        return;
      }

      reply.status(400).send({ message: "Unable to link profile." });
    },
  );

  fastify.post<{ Body: { username: string; password: string } }>(
    "/profile/auth",
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
      const { username, password } = request.body;

      const client = new Instagram(username);
      const profile = await client.getProfileByCreator(request.userId);

      if (profile) {
        if (profile.creatorId != request.userId) {
          reply
            .status(400)
            .send({ message: "Cannot authenticate account not linked." });
          return;
        }

        const auth = await client.authenticate(password);

        if (auth.status === "authenticated") {
          await client.saveSession();
          reply.status(200).send({ message: "Authenticated." });
          return;
        } else if (auth.status === "twoFactorSent") {
          reply
            .status(200)
            .send({ message: "Two factor authentication required." });

          return;
        }
      }

      reply
        .status(200)
        .send({ message: "Unable to authenticate. Check profile input." });
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
      const valid = await client.getAccountInfo();

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
