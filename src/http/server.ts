import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import cookie from '@fastify/cookie';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { registerRestaurant } from "./routes/register-restaurant";
import { sendAuthLink } from "./routes/send-auth-link";
import { authPlugin } from "./auth";
import { authenticateFromLink } from "./routes/authenticate-from-link";
import { signOut } from "./routes/sign-out";
import { getProfile } from './routes/get-profile'
import { getManagedRestaurante } from "./routes/get-managed-restaurante";
import { approveOrder } from "./routes/approve-order";
import { cancelOrder } from "./routes/cancel-order";
import { deliverOrder } from "./routes/deliver-order";
import { dispatchOrder } from "./routes/dispatch-order";
import { getDailyReceiptInPeriod } from "./routes/get-daily-receipt-in-period";
import { getDayOrdersAmount } from "./routes/get-day-orders-amount";
import { getMonthReceipt } from "./routes/get-month-receipt";
import { getMonthCanceledOrdersAmount } from "./routes/get-month-cancel-order-amount";
import { getMonthOrdersAmount } from "./routes/get-month-orders-amount";
import { getOrderDetails } from "./routes/get-order-details";
import { getOrders } from "./routes/get-order";
import { getPopularProducts } from "./routes/get-popular-products";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, { origin: "*" });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cookie);

app.register(authPlugin);

app.register(registerRestaurant);
app.register(sendAuthLink);
app.register(authenticateFromLink);
app.register(signOut);
app.register(getProfile);
app.register(getManagedRestaurante);
app.register(approveOrder);
app.register(cancelOrder);
app.register(deliverOrder);
app.register(dispatchOrder);
app.register(getDailyReceiptInPeriod);
app.register(getDayOrdersAmount);
app.register(getMonthCanceledOrdersAmount);
app.register(getMonthOrdersAmount);
app.register(getMonthReceipt);
app.register(getOrderDetails);
app.register(getOrders);
app.register(getPopularProducts);


app.listen({ port: 3333 }).then(() => {
  console.log("HTTP server running!");
});
