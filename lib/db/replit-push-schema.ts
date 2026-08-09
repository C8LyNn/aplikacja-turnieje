import { pgSchema } from "drizzle-orm/pg-core";

// This empty built-in namespace is the only schema visible to Replit's
// automatic Drizzle push. Application tables live in public and remain under
// reviewed forward-only migrations.
export const replitPushSchema = pgSchema("information_schema");
