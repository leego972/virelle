import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  decimal,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  credits: int("credits").default(100).notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free","amateur","independent","creator","studio","industry"]).default("free").notNull(),
  referralCode: varchar("referralCode", { length: 16 }),
  referredBy: int("referredBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  pushToken: varchar("pushToken", { length: 512 }),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  genre: varchar("genre", { length: 100 }),
  logline: text("logline"),
  status: mysqlEnum("status", ["draft","in_progress","completed","archived"]).default("draft").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const scenes = mysqlTable("scenes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  sceneNumber: int("sceneNumber").notNull(),
  location: varchar("location", { length: 255 }),
  timeOfDay: varchar("timeOfDay", { length: 50 }),
  characters: json("characters"),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  status: mysqlEnum("status", ["draft","generating","ready","failed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Scene = typeof scenes.$inferSelect;
export type InsertScene = typeof scenes.$inferInsert;

export const characters = mysqlTable("characters", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }),
  description: text("description"),
  portraitUrl: text("portraitUrl"),
  traits: json("traits"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Character = typeof characters.$inferSelect;

export const scripts = mysqlTable("scripts", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  content: text("content"),
  version: int("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Script = typeof scripts.$inferSelect;

export const storyboardPanels = mysqlTable("storyboard_panels", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sceneId: int("sceneId"),
  panelNumber: int("panelNumber").notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  cameraAngle: varchar("cameraAngle", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StoryboardPanel = typeof storyboardPanels.$inferSelect;

export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  sceneId: int("sceneId"),
  prompt: text("prompt"),
  videoUrl: text("videoUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"),
  status: mysqlEnum("status", ["generating","ready","failed"]).default("generating").notNull(),
  type: mysqlEnum("type", ["clip","trailer","film"]).default("clip").notNull(),
  creditsUsed: int("creditsUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Video = typeof videos.$inferSelect;

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  role: mysqlEnum("role", ["user","assistant"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChatMessage = typeof chatMessages.$inferSelect;

export const shotLists = mysqlTable("shot_lists", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sceneId: int("sceneId"),
  content: json("content"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const budgetEstimates = mysqlTable("budget_estimates", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  totalBudget: decimal("totalBudget", { precision: 12, scale: 2 }),
  lineItems: json("lineItems"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner","director","writer","editor","viewer"]).default("viewer").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
});

export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredId: int("referredId").notNull(),
  creditsAwarded: int("creditsAwarded").default(50).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["earn","spend","refund","bonus"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Film Post-Production ─────────────────────────────────────────────────────

export const filmMixSettings = mysqlTable("film_mix_settings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  dialogueBus: decimal("dialogueBus", { precision: 4, scale: 3 }).default("0.850"),
  musicBus: decimal("musicBus", { precision: 4, scale: 3 }).default("0.700"),
  effectsBus: decimal("effectsBus", { precision: 4, scale: 3 }).default("0.750"),
  masterVolume: decimal("masterVolume", { precision: 4, scale: 3 }).default("1.000"),
  reverbRoom: mysqlEnum("reverbRoom", ["none","small","medium","large","hall","cathedral"]).default("none"),
  reverbAmount: decimal("reverbAmount", { precision: 4, scale: 3 }).default("0.000"),
  compressionRatio: decimal("compressionRatio", { precision: 5, scale: 2 }).default("1.00"),
  noiseReduction: int("noiseReduction").default(0),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export const filmAdrTracks = mysqlTable("film_adr_tracks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  characterName: varchar("characterName", { length: 128 }).notNull(),
  dialogueLine: text("dialogueLine"),
  trackType: mysqlEnum("trackType", ["adr","wild_track","loop_group","walla"]).default("adr"),
  status: mysqlEnum("status", ["pending","recorded","approved","rejected"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const filmFoleyTracks = mysqlTable("film_foley_tracks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  foleyType: mysqlEnum("foleyType", ["footsteps","cloth","props","impacts","environmental","custom"]).default("custom"),
  description: text("description"),
  status: mysqlEnum("status", ["pending","recorded","approved","rejected"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const filmScoreCues = mysqlTable("film_score_cues", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  cueNumber: varchar("cueNumber", { length: 20 }).default("TBD"),
  title: varchar("title", { length: 200 }).notNull(),
  cueType: mysqlEnum("cueType", ["underscore","source_music","sting","theme","transition","silence"]).default("underscore"),
  description: text("description"),
  durationSeconds: int("durationSeconds").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Funding Applications ─────────────────────────────────────────────────────

export const fundingApplications = mysqlTable("funding_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  fundingOrganization: varchar("fundingOrganization", { length: 200 }).notNull(),
  projectTitle: varchar("projectTitle", { length: 300 }).notNull(),
  status: mysqlEnum("status", ["draft","submitted","approved","rejected"]).default("draft"),
  formData: json("formData"),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
