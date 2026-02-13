import dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { users } from "./config/schema.js";
import { hashPassword } from "./utils/password.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const email = process.env.SEED_EMAIL || "admin@sarjmodul.com";
const password = process.env.SEED_PASSWORD || "Admin123!";
const name = process.env.SEED_NAME || "Super Admin";
const numaraTaj = process.env.SEED_NUMARATAJ || "SA001";
const phone = process.env.SEED_PHONE || "9000000000";

async function seed() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  console.log("Seeding database...");

  // Check if super admin already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Super admin (${email}) already exists. Skipping seed.`);
    await client.end();
    return;
  }

  const hashedPassword = await hashPassword(password);

  await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    role: "super_admin",
    tenantId: null,
    numaraTaj,
    phone,
  });

  console.log(`Super admin created: ${email}`);
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
