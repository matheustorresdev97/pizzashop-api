import { FastifyPluginAsync } from 'fastify';
import { UnauthorizedError } from '../errors/unauthorized-error';
import dayjs from 'dayjs';
import { db } from '../../db/connection';
import { orders } from '../../db/schema';
import { and, count, eq, gte, sql } from 'drizzle-orm';

export const getDayOrdersAmount: FastifyPluginAsync = async (app) => {
  app.get('/metrics/day-orders-amount', {
    preHandler: app.authenticate, // Adiciona autenticação
  }, async (request, reply) => {
    const { restauranteId } = await request.getCurrentUser();

    if (!restauranteId) {
      throw new UnauthorizedError();
    }

    const today = dayjs();
    const yesterday = today.subtract(1, 'day');
    const startOfYesterday = yesterday.startOf('day');

    const orderPerDay = await db
      .select({
        dayWithMonthAndYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        amount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restauranteId),
          gte(orders.createdAt, startOfYesterday.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

    const todayWithMonthAndYear = today.format('YYYY-MM-DD');
    const yesterdayWithMonthAndYear = yesterday.format('YYYY-MM-DD');

    const todayOrdersAmount = orderPerDay.find((order) => {
      return order.dayWithMonthAndYear === todayWithMonthAndYear;
    });

    const yesterdayOrdersAmount = orderPerDay.find((order) => {
      return order.dayWithMonthAndYear === yesterdayWithMonthAndYear;
    });

    const diffFromYesterday =
      todayOrdersAmount && yesterdayOrdersAmount
        ? (todayOrdersAmount.amount * 100) / yesterdayOrdersAmount.amount
        : null;

    return {
      amount: todayOrdersAmount?.amount || 0,
      diffFromYesterday: diffFromYesterday
        ? Number((diffFromYesterday - 100).toFixed(2))
        : 0,
    };
  });
};
