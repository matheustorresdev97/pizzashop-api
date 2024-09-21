import { db } from "@/db/connection";
import { restaurants, users } from "@/db/schema";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const registerRestaurant: FastifyPluginAsyncZod = async (app) => {
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
        const [manager] = await db
          .insert(users)
          .values({
            name: managerName,
            email,
            phone,
            role: 'manager',
          })
          .returning({
            id: users.id,
          });


        await db.insert(restaurants).values({
          name: restaurantName,
          managerId: manager.id,
        });

        reply.status(204).send();
      } catch (error) {
        console.error('Error creating restaurant:', error);
        reply.status(500).send({ error: 'Failed to create restaurant' });
      }
    }
  );
};
