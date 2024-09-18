import { createManager, createRestaurant } from "@/app/functions/create-restaurant";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const createRestaurantRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/restaurantes",
    {
      schema: {
        body: z.object({
          restaurantName: z.string(),
          managerName: z.string(),
          phone: z.string(),
          email: z.string().email(),
        }),
      },
    },

    async (request, reply) => {
      const { restaurantName, managerName, email, phone } = request.body;

      try {
        const manager = await createManager({ name: managerName, email, phone });
        await createRestaurant({ name: restaurantName, managerId: manager.id });

        reply.status(204).send();
      } catch (error) {
        console.error('Error creating restaurant:', error);
        reply.status(500).send({ error: 'Failed to create restaurant' });
      }
    }
  );
};
