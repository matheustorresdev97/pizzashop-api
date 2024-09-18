import { db } from "@/db/connection";
import { restaurants, users } from "@/db/schema";


export async function createManager({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [manager] = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      role: 'manager',
    })
    .returning({
      id: users.id,
    });
  return manager;
}

export async function createRestaurant({ name, managerId }: { name: string; managerId: string }) {
  await db.insert(restaurants).values({
    name,
    managerId,
  });
}
