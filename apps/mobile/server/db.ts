import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import {
  InsertUser,
  InsertProject,
  InsertScene,
  users,
  projects,
  scenes,
  characters,
  scripts,
  storyboardPanels,
  videos,
  chatMessages,
  shotLists,
  budgetEstimates,
  teamMembers,
  referrals,
  creditTransactions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

const ADMIN_EMAILS = ["leego972@gmail.com", "brobroplzcheck@gmail.com"];

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
    if (isAdmin || user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    } else if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    if (!values.referralCode) {
      values.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserCredits(userId: number, delta: number, description: string, type: "earn" | "spend" | "refund" | "bonus") {
  const db = await getDb();
  if (!db) return;
  const user = await getUserById(userId);
  if (!user) return;
  if (user.role === "admin") return;
  const newCredits = Math.max(0, user.credits + delta);
  await db.update(users).set({ credits: newCredits }).where(eq(users.id, userId));
  await db.insert(creditTransactions).values({ userId, amount: delta, type, description });
}

export async function getCreditHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions).where(eq(creditTransactions.userId, userId)).orderBy(desc(creditTransactions.createdAt)).limit(50);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return result[0];
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) return;
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projects).where(eq(projects.id, id));
}

// ─── Scenes ───────────────────────────────────────────────────────────────────

export async function getProjectScenes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scenes).where(eq(scenes.projectId, projectId)).orderBy(scenes.sceneNumber);
}

export async function createScene(data: InsertScene) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(scenes).values(data);
}

export async function updateScene(id: number, data: Partial<InsertScene>) {
  const db = await getDb();
  if (!db) return;
  await db.update(scenes).set(data).where(eq(scenes.id, id));
}

export async function deleteScene(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(scenes).where(eq(scenes.id, id));
}

// ─── Characters ───────────────────────────────────────────────────────────────

export async function getProjectCharacters(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(characters).where(eq(characters.projectId, projectId));
}

export async function createCharacter(data: typeof characters.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(characters).values(data);
}

// ─── Scripts ──────────────────────────────────────────────────────────────────

export async function getProjectScript(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scripts).where(eq(scripts.projectId, projectId)).orderBy(desc(scripts.version)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function saveScript(projectId: number, content: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await getProjectScript(projectId);
  if (existing) {
    await db.update(scripts).set({ content, version: existing.version + 1 }).where(eq(scripts.id, existing.id));
  } else {
    await db.insert(scripts).values({ projectId, content, version: 1 });
  }
}

// ─── Storyboard ───────────────────────────────────────────────────────────────

export async function getStoryboardPanels(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storyboardPanels).where(eq(storyboardPanels.projectId, projectId)).orderBy(storyboardPanels.panelNumber);
}

export async function createStoryboardPanel(data: typeof storyboardPanels.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(storyboardPanels).values(data);
}

// ─── Videos ───────────────────────────────────────────────────────────────────

export async function getUserVideos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
}

export async function getProjectVideos(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).where(eq(videos.projectId, projectId)).orderBy(desc(videos.createdAt));
}

export async function createVideo(data: typeof videos.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videos).values(data);
  return result[0];
}

export async function updateVideo(id: number, data: Partial<typeof videos.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(videos).set(data).where(eq(videos.id, id));
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export async function getChatHistory(userId: number, projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = projectId
    ? and(eq(chatMessages.userId, userId), eq(chatMessages.projectId, projectId))
    : eq(chatMessages.userId, userId);
  return db.select().from(chatMessages).where(conditions).orderBy(chatMessages.createdAt).limit(100);
}

export async function saveChatMessage(data: typeof chatMessages.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values(data);
}

// ─── Shot Lists ───────────────────────────────────────────────────────────────

export async function getShotList(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shotLists).where(eq(shotLists.projectId, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function saveShotList(projectId: number, content: unknown) {
  const db = await getDb();
  if (!db) return;
  const existing = await getShotList(projectId);
  if (existing) {
    await db.update(shotLists).set({ content }).where(eq(shotLists.id, existing.id));
  } else {
    await db.insert(shotLists).values({ projectId, content });
  }
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export async function getBudgetEstimate(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(budgetEstimates).where(eq(budgetEstimates.projectId, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function saveBudgetEstimate(projectId: number, lineItems: unknown, totalBudget: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await getBudgetEstimate(projectId);
  if (existing) {
    await db.update(budgetEstimates).set({ lineItems, totalBudget }).where(eq(budgetEstimates.id, existing.id));
  } else {
    await db.insert(budgetEstimates).values({ projectId, lineItems, totalBudget });
  }
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export async function getProjectTeam(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers).where(eq(teamMembers.projectId, projectId));
}

export async function addTeamMember(projectId: number, userId: number, role: "owner" | "director" | "writer" | "editor" | "viewer") {
  const db = await getDb();
  if (!db) return;
  await db.insert(teamMembers).values({ projectId, userId, role });
}

// ─── Referrals ────────────────────────────────────────────────────────────────

export async function getReferralsByUser(referrerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(referrals).where(eq(referrals.referrerId, referrerId));
}

export async function processReferral(referrerId: number, referredId: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(referrals).values({ referrerId, referredId, creditsAwarded: 50 });
  await updateUserCredits(referrerId, 50, "Referral bonus", "bonus");
  await updateUserCredits(referredId, 25, "Welcome referral bonus", "bonus");
}

// ─── Film Post-Production ─────────────────────────────────────────────────────

export async function getMixSettings(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.filmMixSettings).where(eq(schema.filmMixSettings.projectId, projectId));
  return rows[0] ?? null;
}

export async function saveMixSettings(projectId: number, data: Partial<typeof schema.filmMixSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getMixSettings(projectId);
  if (existing) {
    await db.update(schema.filmMixSettings).set(data).where(eq(schema.filmMixSettings.projectId, projectId));
  } else {
    await db.insert(schema.filmMixSettings).values({ projectId, ...data });
  }
}

export async function getAdrTracks(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.filmAdrTracks).where(eq(schema.filmAdrTracks.projectId, projectId));
}

export async function createAdrTrack(data: typeof schema.filmAdrTracks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(schema.filmAdrTracks).values(data);
}

export async function updateAdrTrack(id: number, data: Partial<typeof schema.filmAdrTracks.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.filmAdrTracks).set(data).where(eq(schema.filmAdrTracks.id, id));
}

export async function deleteAdrTrack(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schema.filmAdrTracks).where(eq(schema.filmAdrTracks.id, id));
}

export async function getFoleyTracks(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.filmFoleyTracks).where(eq(schema.filmFoleyTracks.projectId, projectId));
}

export async function createFoleyTrack(data: typeof schema.filmFoleyTracks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(schema.filmFoleyTracks).values(data);
}

export async function updateFoleyTrack(id: number, data: Partial<typeof schema.filmFoleyTracks.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.filmFoleyTracks).set(data).where(eq(schema.filmFoleyTracks.id, id));
}

export async function deleteFoleyTrack(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schema.filmFoleyTracks).where(eq(schema.filmFoleyTracks.id, id));
}

export async function getScoreCues(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.filmScoreCues).where(eq(schema.filmScoreCues.projectId, projectId));
}

export async function createScoreCue(data: typeof schema.filmScoreCues.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(schema.filmScoreCues).values(data);
}

export async function updateScoreCue(id: number, data: Partial<typeof schema.filmScoreCues.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.filmScoreCues).set(data).where(eq(schema.filmScoreCues.id, id));
}

export async function deleteScoreCue(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schema.filmScoreCues).where(eq(schema.filmScoreCues.id, id));
}

// ─── Funding Applications ─────────────────────────────────────────────────────

export async function getFundingApplications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.fundingApplications).where(eq(schema.fundingApplications.userId, userId)).orderBy(desc(schema.fundingApplications.createdAt));
}

export async function createFundingApplication(data: typeof schema.fundingApplications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schema.fundingApplications).values(data);
  return result[0];
}

export async function updateFundingApplication(id: number, data: Partial<typeof schema.fundingApplications.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(schema.fundingApplications).set(data).where(eq(schema.fundingApplications.id, id));
}

export async function deleteFundingApplication(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(schema.fundingApplications).where(eq(schema.fundingApplications.id, id));
}

// ─── Push Notifications ───────────────────────────────────────────────────────

export async function updateUserPushToken(userId: number, pushToken: string | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ pushToken }).where(eq(users.id, userId));
}
