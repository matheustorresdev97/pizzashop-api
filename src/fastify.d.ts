// fastify.d.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    signOut: () => Promise<void>;
    getCurrentUser: () => Promise<JwtPayload>; 
  }
}

declare module 'fastify' {
  interface FastifyReply {
    signUser: (payload: JwtPayload, reply: FastifyReply) => Promise<void>; 
  }
}