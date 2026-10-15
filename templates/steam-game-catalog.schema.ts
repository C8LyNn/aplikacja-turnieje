import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const steamCatalogGames = pgTable(
  "steam_catalog_games",
  {
    id: serial("id").primaryKey(),
    steamAppId: integer("steam_app_id").notNull(),
    name: text("name").notNull(),
    steamUrl: text("steam_url").notNull(),
    headerImageUrl: text("header_image_url"),
    developer: text("developer"),
    publisher: text("publisher"),
    releaseDate: text("release_date"),
    shortDescription: text("short_description"),
    status: text("status").notNull().default("unclassified"),
    steamRawData: jsonb("steam_raw_data")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("steam_catalog_games_app_id_uidx").on(table.steamAppId),
  ],
);

export const steamCatalogTerms = pgTable(
  "steam_catalog_terms",
  {
    id: serial("id").primaryKey(),
    facet: text("facet").notNull(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("steam_catalog_terms_facet_slug_uidx").on(
      table.facet,
      table.slug,
    ),
  ],
);

export const steamCatalogGameTerms = pgTable(
  "steam_catalog_game_terms",
  {
    gameId: integer("game_id")
      .notNull()
      .references(() => steamCatalogGames.id, { onDelete: "cascade" }),
    termId: integer("term_id")
      .notNull()
      .references(() => steamCatalogTerms.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("default"),
    position: integer("position").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.gameId, table.termId] })],
);
