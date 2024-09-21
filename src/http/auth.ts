import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { env } from "../env";
import { UnauthorizedError } from "./errors/unauthorized-error";

interface JwtPayload {
  sub: string;
  restauranteId?: string;
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  app.register(fastifyJwt, {
    secret: env.JWT_SECRET_KEY,
    cookie: {
      cookieName: 'auth',
      signed: false,
    },
    sign: {
      expiresIn: '7d',
    },
  });

  app.register(fastifyCookie);

  app.decorate('signUser', async function (payload: JwtPayload, reply: FastifyReply) {
    const token = this.jwt.sign(payload);
    
    reply.setCookie('auth', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    });
  });

  app.decorate('signOut', function (reply: FastifyReply) {
    reply.clearCookie('auth');
  });

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  app.decorate('getCurrentUser', async function (request: FastifyRequest) {
    try {
      const token = request.cookies.auth; 

      if (!token) {
        throw new UnauthorizedError()
      }

      const payload = await request.jwtVerify<JwtPayload>();

      return {
        userId: payload.sub,
        restauranteId: payload.restauranteId,
      };
    } catch (err) {
      throw new Error('Unauthorized.');
    }
  });
};

export default authPlugin;
