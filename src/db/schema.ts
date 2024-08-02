import { pgTable, text, timestamp, numeric, pgEnum, boolean, integer } from "drizzle-orm/pg-core";

export const type = pgEnum("type", ["free-paywall","paid"]);
export const key_type = pgEnum("key_type", ["temporary","permanent","checkpoint"]);
export const execution_type = pgEnum("execution_type", ["mobile","desktop","unknown"]);

export const project = pgTable("project", {
  project_id: text("project_id").primaryKey().notNull(),
  
  name: text("name").notNull(),
  description: text("description").notNull(),
  creation_timestamp: timestamp("created_at").notNull().defaultNow(),
  author_id: text("author_id").notNull(),
  project_type: type("project_type").notNull().default("paid"),

  github_owner: text("github_owner").notNull(),
  github_repo: text("github_repo").notNull(),
  github_path: text("github_path").notNull(),
  github_token: text("github_token").notNull(),

  // in minutes
  linkvertise_key_duration: numeric("linkvertise_key_duration").notNull().default("1"),
  
  discord_webhook: text("discord_webhook"),
  discord_link: text("discord_link"),
});

export const project_api_keys = pgTable("project_api_keys", {
  project_id: text("project_id").notNull(),
  api_key: text("api_key").notNull(),
  name: text("name").notNull(),
  creator_id: text("creator_id").notNull(),
});

export interface ProjectApiKey {
  project_id: string;
  api_key: string;
  name: string;
  creator_id: string;
}

// TODO: add checkpoints table


export interface Project {
  project_id: string;
  name: string;
  description: string;
  creation_timestamp: Date;
  author_id: string;
  linkvertise_key_duration: string;
  project_type: "free-paywall" | "paid";

  github_owner: string;
  github_repo: string;
  github_path: string;
  github_token: string;

  discord_link: string | null | undefined;
  discord_webhook: string | null | undefined;

}

export const admins = pgTable("admins", {
  discord_id: text("discord_id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

export const project_admins = pgTable("project_admins", {
  discord_id: text("discord_id").notNull(),
  project_id: text("project_id").notNull(),
});

export const banned_users = pgTable("banned_users", {
  hwid: text("hwid").notNull(),
  reason: text("reason"),
  project_id: text("project_id").notNull(),
  expires: timestamp("expires"),
});

export interface BannedUser {
  hwid: string;
  reason: string | undefined;
  project_id: string;
  expires: Date | undefined;
}

export const users = pgTable("users", {
  project_id: text("project_id").notNull(),
  discord_id: text("discord_id").notNull(),
  username: text("name").notNull(),
  note: text("note"),
  key: text("key").notNull(),
  key_expires: timestamp("key_expires"),
  key_type: key_type("key_type"),
  hwid: text("hwid"),
  executor: text("executor"),
});

export interface Key {
  project_id: string;
  key: string;
  key_expires: Date | null;
  key_type: "temporary" | "permanent" | "checkpoint";
  discord_id: string;
  username: string;
  note: string | null;
  hwid: string | null;
  executor: string | null;
}

export const project_executions = pgTable("project_executions", {
  discord_id: text("discord_id"),
  project_id: text("project_id").notNull(),
  execution_timestamp: timestamp("execution_timestamp").notNull().defaultNow(),
  execution_type: execution_type("execution_type").notNull(),
});

export type InsertProjectApiKey = typeof project_api_keys.$inferInsert;
export type SelectProjectApiKey = typeof project_api_keys.$inferSelect;

export type InsertAdmins = typeof admins.$inferInsert;
export type SelectAdmins = typeof admins.$inferSelect;

export type InsertProject = typeof project.$inferInsert;
export type SelectProject = typeof project.$inferSelect;

export type InsertProjectAdmin = typeof project_admins.$inferInsert;
export type SelectProjectAdmin = typeof project_admins.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertProjectExecution = typeof project_executions.$inferInsert;
export type SelectProjectExecution = typeof project_executions.$inferSelect;