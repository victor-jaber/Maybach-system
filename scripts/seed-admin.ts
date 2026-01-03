import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { users } from "../shared/models/auth";

async function seedAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@maybach.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Administrador";

  console.log("Checking for existing admin user...");

  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length > 0) {
    console.log("Admin user already exists. Skipping seed.");
    await pool.end();
    return;
  }

  console.log("Creating admin user...");

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await db.insert(users).values({
    email: adminEmail,
    passwordHash,
    name: adminName,
    role: "admin",
  });

  console.log("Admin user created successfully!");
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log("\nIMPORTANT: Change the default password after first login!");

  await pool.end();
}

seedAdmin().catch((error) => {
  console.error("Failed to seed admin user:", error);
  process.exit(1);
});
