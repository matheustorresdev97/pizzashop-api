import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from '@/db/connection';
import { UnauthorizedError } from '../errors/unauthorized-error';
import { and, eq } from 'drizzle-orm';

export const getOrderDetails: FastifyPluginAsyncZod = async (app) => {
    app.get(
        '/orders/:orderId',
        {
            schema: {
                params: z.object({
                    orderId: z.string(),
                }),
            },
        },
        async (request, reply) => {
            const { orderId } = request.params;

            try {
                const { restauranteId } = await request.getCurrentUser();
                if (!restauranteId) {
                    throw new UnauthorizedError();
                }

                const order = await db.query.orders.findFirst({
                    columns: {
                        id: true,
                        status: true,
                        totalInCents: true,
                        createdAt: true,
                    },
                    with: {
                        customer: {
                            columns: {
                                name: true,
                                phone: true,
                                email: true,
                            },
                        },
                        orderItems: {
                            columns: {
                                id: true,
                                priceInCents: true,
                                quantity: true,
                            },
                            with: {
                                product: {
                                    columns: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                    // Corrigindo a função `where` para usar a sintaxe adequada com `eq`
                    where: (orders) => and(eq(orders.id, orderId),
                        eq(orders.restaurantId, restauranteId)),

                });

                if (!order) {
                    return reply.status(400).send({ message: 'Order not found.' });
                }

                return reply.send(order);
            } catch (error) {
                console.error('Error fetching order details:', error);
                return reply.status(500).send({ error: 'Failed to fetch order details' });
            }
        }
    );
};
