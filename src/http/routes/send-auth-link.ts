import { db } from "@/db/connection";
import nodemailer from 'nodemailer'
import { authLinks, users } from "@/db/schema";
import { env } from "@/env";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getMailClient } from "@/lib/mail";

export const sendAuthLink: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/authenticate",
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
    },

    async (request, reply) => {
      const { email } = request.body;

      try {
        const userFromEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
        .then(([user]) => user);

      if (!userFromEmail) {
        return reply.status(404).send({ error: "User not found" });
      }

      const authLinkCode = createId();

      await db.insert(authLinks).values({
        userId: userFromEmail.id,
        code: authLinkCode,
      });

      const authLink = new URL("/auth-links/authenticate", env.API_BASE_URL);
      authLink.searchParams.set("code", authLinkCode);
      authLink.searchParams.set("redirect", env.AUTH_REDIRECT_URL);

      const mail = await getMailClient()

      const info = await mail.sendMail({
        from: {
          name: 'Pizza Shop',
          address: 'hi@pizzashop.com',
        },
        to: email,
        subject: 'Authenticate to Pizza Shop',
        text: `Use the following link to authenticate on Pizza Shop: ${authLink.toString()}`,
      })
      console.log(nodemailer.getTestMessageUrl(info))
          
      } catch (error) {
        console.error('Error creating restaurant:', error);
        reply.status(500).send({ error: 'Failed to create restaurant' });
      }
    }
  );
};
