import { FastifyPluginAsync } from 'fastify';
import { UnauthorizedError } from '../errors/unauthorized-error';
import dayjs from 'dayjs';
import { db } from '../../db/connection';
import { orders } from '../../db/schema';
import { and, count, eq, gte, sql } from 'drizzle-orm';

export const getMonthOrdersAmount: FastifyPluginAsync = async (app) => {
  app.get('/metrics/month-orders-amount', {
    preHandler: app.authenticate, // Adiciona autenticação
  }, async (request, reply) => {
    const { restauranteId } = await request.getCurrentUser();

    if (!restauranteId) {
      throw new UnauthorizedError();
    }

    const today = dayjs();
    const lastMonth = today.subtract(1, 'month');
    const startOfLastMonth = lastMonth.startOf('month');

    const ordersPerMonth = await db
      .select({
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        amount: count(),
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

    const currentMonthOrdersAmount = ordersPerMonth.find((order) => {
      return order.monthWithYear === currentMonthWithYear;
    });

    const lastMonthOrdersAmount = ordersPerMonth.find((order) => {
      return order.monthWithYear === lastMonthWithYear;
    });

    const diffFromLastMonth =
      currentMonthOrdersAmount && lastMonthOrdersAmount
        ? (currentMonthOrdersAmount.amount * 100) / lastMonthOrdersAmount.amount
        : null;

    return {
      amount: currentMonthOrdersAmount?.amount || 0,
      diffFromLastMonth: diffFromLastMonth
        ? Number((diffFromLastMonth - 100).toFixed(2))
        : 0,
    };
  });
};
