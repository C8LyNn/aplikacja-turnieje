import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // Runtime code continues to use the complete authoritative schema below.
  // Drizzle Kit 0.31.10 cannot round-trip the PostgreSQL constraints installed
  // by the forward-only migrations without destructive false-positive DDL.
  //
  // Replit Publishing has no "skip push" switch, so its push is deliberately
  // scoped to PostgreSQL's built-in information_schema and to a table pattern
  // that matches nothing. The public schema is managed only by reviewed,
  // forward-only SQL migrations.
  schema: "./replit-push-schema.ts",
  dialect: "postgresql",
  tablesFilter: ["__replit_push_manages_no_tables__"],
  schemaFilter: ["information_schema"],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
