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

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(fastifyCors, { origin: "*" });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cookie);

app.register(authPlugin);

app.register(registerRestaurant);
app.register(sendAuthLink);
app.register(authenticateFromLink);
app.register(signOut)
app.register(getProfile)
app.register(getManagedRestaurante)

app.listen({ port: 3333 }).then(() => {
  console.log("HTTP server running!");
});
