import { Sentry } from "./sentry.js";
import { UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const EXPIRED_TESTER_ERR_MSG =
  "Your 48-hour trial has ended. Your projects and downloads are still available — upgrade to a paid plan to continue creating.";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Never expose raw database/SQL errors to the client
    const isSqlError = error.message?.includes('Failed query') ||
      error.message?.includes('SELECT') ||
      error.message?.includes('INSERT') ||
      error.message?.includes('UPDATE') ||
      error.message?.includes('DELETE') ||
      error.message?.includes('COLUMN') ||
      error.message?.includes('Unknown column') ||
      error.message?.includes('ER_');

    if (isSqlError) {
      console.error('[tRPC] Database error (hidden from client):', error.message);
      return {
        ...shape,
        message: 'An internal error occurred. Please try again.',
        data: {
          ...shape.data,
        },
      };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

type InputRecord = Record<string, unknown>;

function asInputRecord(input: unknown): InputRecord | null {
  return input && typeof input === "object" && !Array.isArray(input) ? input as InputRecord : null;
}

async function readInput(opts: unknown): Promise<InputRecord | null> {
  const anyOpts = opts as any;
  if (anyOpts.input !== undefined) return asInputRecord(anyOpts.input);
  if (typeof anyOpts.getRawInput === "function") return asInputRecord(await anyOpts.getRawInput());
  return null;
}

async function requireProjectAccess(projectId: number, userId: number): Promise<void> {
  const db = await import("../db");
  const access = await db.getProjectAccess(projectId, userId);
  if (!access) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
}

async function requireCharacterAccess(characterId: number, userId: number): Promise<void> {
  const db = await import("../db");
  const character = await db.getCharacterById(characterId);
  if (!character || character.userId !== userId) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
}

const enforceOwnership = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) return next();

  const path = String((opts as any).path || "");
  const input = await readInput(opts);
  if (!input) return next();

  const projectId = input.projectId;
  if (typeof projectId === "number" && Number.isInteger(projectId) && projectId > 0) {
    await requireProjectAccess(projectId, ctx.user.id);
  }

  const id = input.id;
  if (typeof id === "number" && Number.isInteger(id) && id > 0) {
    if (path.startsWith("project.")) await requireProjectAccess(id, ctx.user.id);
    if (path.startsWith("character.")) await requireCharacterAccess(id, ctx.user.id);
  }

  return next();
});

// ─── requireUser: basic auth check ───────────────────────────────────────────
const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/** Standard protected procedure — allows expired testers in read-only mode. */
export const protectedProcedure = t.procedure.use(requireUser).use(enforceOwnership);

// ─── blockExpiredTester: creation guard ──────────────────────────────────────
const blockExpiredTester = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  if (ctx.isExpiredTester) {
    throw new TRPCError({ code: "FORBIDDEN", message: EXPIRED_TESTER_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * creationProcedure — use for any mutation that creates, generates, or modifies
 * content (projects, scenes, characters, AI generation, payments, etc.).
 * Expired tester accounts receive a clear upgrade prompt instead of an error.
 */
export const creationProcedure = t.procedure.use(blockExpiredTester).use(enforceOwnership);

// ─── adminProcedure ───────────────────────────────────────────────────────────
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
