import { FastifyPluginAsync } from 'fastify';
import { UnauthorizedError } from '../errors/unauthorized-error';
import dayjs from 'dayjs';
import { db } from '../../db/connection';
import { orders } from '../../db/schema';
import { and, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { z } from 'zod';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

type QueryParams = z.infer<typeof querySchema>;

export const getDailyReceiptInPeriod: FastifyPluginAsync = async (app) => {
  app.get('/metrics/daily-receipt-in-period', { 
    preHandler: app.authenticate,
    schema: {
      querystring: querySchema, // Adiciona a validação de schema
    }
  }, async (request, reply) => {
    const { restauranteId } = await request.getCurrentUser();
    if (!restauranteId) {
      throw new UnauthorizedError();
    }
    
    const { from, to } = request.query as QueryParams;
    
    const startDate = from ? dayjs(from) : dayjs().subtract(7, 'days');
    const endDate = to ? dayjs(to) : from ? startDate.add(7, 'days') : dayjs();

    if (endDate.diff(startDate, 'days') > 7) {
      return reply.status(400).send({
        message: 'You cannot list receipt in a larger period than 7 days.',
      });
    }

    const receiptPerDay = await db
      .select({
        date: sql<string>`TO_CHAR(${orders.createdAt}, 'DD/MM')`,
        receipt: sum(orders.totalInCents).mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restauranteId),
          gte(orders.createdAt, startDate.startOf('day').toDate()),
          lte(orders.createdAt, endDate.endOf('day').toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'DD/MM')`);

    const orderedReceiptPerDay = receiptPerDay.sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map(Number);
      const [dayB, monthB] = b.date.split('/').map(Number);
      if (monthA === monthB) {
        return dayA - dayB;
      } else {
        const dateA = new Date(2024, monthA - 1);
        const dateB = new Date(2024, monthB - 1);
        return dateA.getTime() - dateB.getTime();
      }
    });

    return orderedReceiptPerDay;
  });
};
