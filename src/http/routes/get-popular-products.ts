import { FastifyPluginAsync } from 'fastify';
import { UnauthorizedError } from '../errors/unauthorized-error';
import { db } from '../../db/connection';
import { orderItems, orders, products } from '../../db/schema';
import { desc, eq, sum } from 'drizzle-orm';

export const getPopularProducts: FastifyPluginAsync = async (app) => {
    app.get('/metrics/popular-products', { preHandler: app.authenticate, }, async (request, reply) => {
        const { restauranteId } = await request.getCurrentUser();
        if (!restauranteId) {
            throw new UnauthorizedError();
        }

        const popularProducts = await db
        .select({
          product: products.name,
          amount: sum(orderItems.quantity).mapWith(Number),
        })
        .from(orderItems)
        .leftJoin(orders, eq(orders.id, orderItems.orderId))
        .leftJoin(products, eq(products.id, orderItems.productId))
        .where(eq(orders.restaurantId, restauranteId))
        .groupBy(products.name)
        .orderBy(desc(sum(orderItems.quantity))) 
        .limit(5);
  
      return popularProducts;
    });
  };
