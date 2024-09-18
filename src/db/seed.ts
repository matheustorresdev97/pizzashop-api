import { faker } from "@faker-js/faker";
import { restaurants, users } from "./schema";
import { db } from "./connection";

async function seed() {
  await db.delete(users);
  await db.delete(restaurants);

  await db.insert(users).values([
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: "customer",
    },
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: "customer",
    },
  ]);

  const [manager] = await db
    .insert(users)
    .values([
      {
        name: faker.person.fullName(),
        email: "admin@admin.com",
        role: "manager",
      },
    ])
    .returning({
      id: users.id,
    });

  await db.insert(restaurants).values([
    {
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      managerId: manager.id,
    },
  ]);

  process.exit(0);
}

seed().then(() => {
  console.log("🌱 Database seeded successfully!");
});
