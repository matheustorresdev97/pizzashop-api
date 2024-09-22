import { FastifyPluginAsync } from 'fastify';
import { UnauthorizedError } from '../errors/unauthorized-error';
import dayjs from 'dayjs';
import { db } from '../../db/connection';
import { orders } from '../../db/schema';
import { and, eq, gte, sql, sum } from 'drizzle-orm';

export const getMonthReceipt: FastifyPluginAsync = async (app) => {
  app.get('/metrics/month-receipt', {
    preHandler: app.authenticate, 
  }, async (request, reply) => {
    const { restauranteId } = await request.getCurrentUser();
    
    if (!restauranteId) {
      throw new UnauthorizedError();
    }

    const today = dayjs();
    const lastMonth = today.subtract(1, 'month');
    const startOfLastMonth = lastMonth.startOf('month');

    const monthsReceipts = await db
      .select({
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        receipt: sum(orders.totalInCents).mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restauranteId),
          gte(orders.createdAt, startOfLastMonth.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`);

    const currentMonthWithYear = today.format('YYYY-MM'); // Ex: 2024-02
    const lastMonthWithYear = lastMonth.format('YYYY-MM'); // Ex: 2024-01

    const currentMonthReceipt = monthsReceipts.find((monthReceipt) => {
      return monthReceipt.monthWithYear === currentMonthWithYear;
    });

    const lastMonthReceipt = monthsReceipts.find((monthReceipt) => {
      return monthReceipt.monthWithYear === lastMonthWithYear;
    });

    const diffFromLastMonth =
      currentMonthReceipt && lastMonthReceipt
        ? (currentMonthReceipt.receipt * 100) / lastMonthReceipt.receipt
        : null;

    return {
      receipt: currentMonthReceipt?.receipt || 0,
      diffFromLastMonth: diffFromLastMonth
        ? Number((diffFromLastMonth - 100).toFixed(2))
        : 0,
    };
  });
};
