import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { db } from '../../db/connection';
import { createSelectSchema } from 'drizzle-typebox';
import { orders, users } from '../../db/schema';
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm';

// Definindo o esquema para status
const statusSchema = z.enum(['pending', 'processing', 'delivering', 'delivered', 'canceled']).optional();

// Esquema para a querystring
const querySchema = z.object({
  customerName: z.string().optional(),
  orderId: z.string().optional(),
  status: statusSchema,
  pageIndex: z.number().min(0),
});

export const getOrders: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/orders',
    {
      preHandler: app.authenticate,
      schema: {
        querystring: querySchema,
      },
    },
    async (request, reply) => {
      const { restauranteId } = await request.getCurrentUser();

      // Fazendo a validação do tipo usando o Zod
      const parsedQuery = querySchema.parse(request.query);
      const { customerName, orderId, status, pageIndex } = parsedQuery;

      const baseQuery = db
        .select({
          orderId: orders.id,
          createdAt: orders.createdAt,
          status: orders.status,
          total: orders.totalInCents,
          customerName: users.name,
        })
        .from(orders)
        .innerJoin(users, eq(users.id, orders.customerId))
        .where(
          and(
            eq(orders.restaurantId, restauranteId),
            orderId ? ilike(orders.id, `%${orderId}%`) : undefined,
            status ? eq(orders.status, status) : undefined,
            customerName ? ilike(users.name, `%${customerName}%`) : undefined,
          ),
        );

      const [amountOfOrdersQuery, allOrders] = await Promise.all([
        db.select({ count: count() }).from(baseQuery.as('baseQuery')),
        db
          .select()
          .from(baseQuery.as('baseQuery'))
          .offset(pageIndex * 10)
          .limit(10)
          .orderBy((fields) => {
            return [
              sql`CASE ${fields.status}
                WHEN 'pending' THEN 1
                WHEN 'processing' THEN 2
                WHEN 'delivering' THEN 3
                WHEN 'delivered' THEN 4
                WHEN 'canceled' THEN 99
              END`,
              desc(fields.createdAt),
            ];
          }),
      ]);

      const amountOfOrders = amountOfOrdersQuery[0].count;
      return {
        orders: allOrders,
        meta: {
          pageIndex,
          perPage: 10,
          totalCount: amountOfOrders,
        },
      };
    }
  );
};
