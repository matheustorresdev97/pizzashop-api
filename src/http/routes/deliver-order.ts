import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../db/connection'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { orders } from '../../db/schema'
import { and, eq } from 'drizzle-orm'

export const deliverOrder: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/orders/:orderId/deliver',
    {
      schema: {
        params: z.object({
          orderId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { orderId } = request.params
      const { restauranteId } = await request.getCurrentUser()

      if (!restauranteId) {
        throw new UnauthorizedError()
      }

      const order = await db.query.orders.findFirst({
        where: and(
          eq(orders.id, orderId),
          eq(orders.restaurantId, restauranteId) 
        ),
      });

      if (!order) {
        return reply.status(400).send({ message: 'Order not found.' })
      }

      if (order.status !== 'delivering') {
        return reply.status(400).send({
          message: 'You cannot deliver orders that are not in "delivering" status.',
        })
      }

      await db
        .update(orders)
        .set({ status: 'delivered' })
        .where(eq(orders.id, orderId))

      return reply.status(204).send() // Retorna 204 No Content após a atualização
    }
  )
}
