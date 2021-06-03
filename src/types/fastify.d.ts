import fastify from "fastify";

declare module "fastify" {
  export interface FastifyInstance<
    HttpServer = Server,
    HttpRequest = IncomingMessage,
    HttpResponse = ServerResponse,
  > {
    creatorAuth: any;
    watcherAuth: any;
  }

  export interface FastifyRequest {
    userId: string;
  }
}
