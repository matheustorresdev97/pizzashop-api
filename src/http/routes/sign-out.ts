import { FastifyPluginAsync } from 'fastify';

export const signOut: FastifyPluginAsync = async (app) => {
  app.post('/sign-out', async (request, reply) => {
    try {
      await request.signOut(); 

      reply.send({ message: 'Logout successful' });
    } catch (err) {
      reply.status(500).send({ error: 'Logout failed' });
    }
  });
};