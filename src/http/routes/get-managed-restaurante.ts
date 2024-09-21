import { db } from "@/db/connection";
import { restaurants } from "@/db/schema";

import { eq } from "drizzle-orm";
import { FastifyPluginAsync } from "fastify";

export const getManagedRestaurante: FastifyPluginAsync = async (app) => {

  app.get('/managed-restaurante', { preHandler: app.authenticate }, async (request, reply) => {
    try {
      const { restauranteId } = await request.getCurrentUser();

      const managedRestaurante = await db.select()
      .from(restaurants) // Consultar a tabela de restaurantes
      .where(eq(restaurants.id, restauranteId)) // Usar o ID do restaurante
      .limit(1);

      if (!managedRestaurante  || managedRestaurante .length === 0) {
        throw new Error('User not found.');
      }

      return managedRestaurante[0]; 
    } catch (error) {
      console.error('Error getting profile:', error);
      return reply.status(500).send({ error: 'Failed to get profile.' });
    }
  });
};