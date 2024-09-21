import { db } from "@/db/connection";
import { authLinks, restaurants } from "@/db/schema";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const authenticateFromLinkSchema = z.object({
    code: z.string(),
    redirect: z.string(),
});

export const authenticateFromLink: FastifyPluginAsyncZod = async (app) => {
    app.get(
        "/auth-links/authenticate",
        {
            schema: {
                querystring: authenticateFromLinkSchema,
            },
            preHandler: app.authenticate, 
        },
        async (request, reply) => {
            const { code, redirect } = request.query;

            try {
                const authLinkFromCode = await db.select()
                    .from(authLinks)
                    .where(eq(authLinks.code, code))
                    .limit(1);

                if (authLinkFromCode.length === 0) {
                    return reply.status(404).send({ error: 'Auth link not found.' });
                }

                const authLink = authLinkFromCode[0];
                const daysSinceAuthLinkWasCreated = dayjs().diff(authLink.createdAt, 'days');

                if (daysSinceAuthLinkWasCreated > 7) {
                    return reply.status(400).send({ error: 'Auth link expired, please generate a new one.' });
                }

                const managedRestaurante = await db.select()
                    .from(restaurants)
                    .where(eq(restaurants.managerId, authLink.userId))
                    .limit(1);

                if (managedRestaurante.length === 0) {
                    return reply.status(404).send({ error: 'Managed restaurant not found.' });
                }

                const restaurant = managedRestaurante[0];

                await reply.signUser({
                    sub: authLink.userId,
                    restauranteId: restaurant.id,
                  }, reply);

                await db.delete(authLinks).where(eq(authLinks.code, code));

                return reply.redirect(redirect);
            } catch (error) {
                console.error('Error authenticating from link:', error);
                return reply.status(500).send({ error: 'Failed to authenticate from link.' });
            }
        }
    );
};
