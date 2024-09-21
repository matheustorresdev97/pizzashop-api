import { db } from "@/db/connection";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";
import { UnauthorizedError } from "../errors/unauthorized-error";

export const getProfile: FastifyPluginAsync = async (app) => {

  app.get('/me', { preHandler: app.authenticate }, async (request, reply) => {
    try {
      const { userId } = await request.getCurrentUser();

      const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.length === 0) {
        throw new UnauthorizedError()
      }

      return user[0]; 
    } catch (error) {
      console.error('Error getting profile:', error);
      return reply.status(500).send({ error: 'Failed to get profile.' });
    }
  });
};