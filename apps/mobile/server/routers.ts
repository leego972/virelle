import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { TIER_MONTHLY_CREDITS } from "../shared/_core/subscription-constants.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserProjects, createProject, getProjectById, updateProject, deleteProject,
  getProjectScenes, createScene, updateScene, deleteScene,
  getProjectCharacters, createCharacter,
  getProjectScript, saveScript,
  getStoryboardPanels, createStoryboardPanel,
  getUserVideos, getProjectVideos, createVideo, updateVideo,
  getChatHistory, saveChatMessage,
  getShotList, saveShotList,
  getBudgetEstimate, saveBudgetEstimate,
  getProjectTeam, addTeamMember,
  getReferralsByUser, getCreditHistory, updateUserCredits, getUserById,
  getMixSettings, saveMixSettings,
  getAdrTracks, createAdrTrack, updateAdrTrack, deleteAdrTrack,
  getFoleyTracks, createFoleyTrack, updateFoleyTrack, deleteFoleyTrack,
  getScoreCues, createScoreCue, updateScoreCue, deleteScoreCue,
  getFundingApplications, createFundingApplication, updateFundingApplication, deleteFundingApplication,
  updateUserPushToken,
} from "./db.js";
import { generateAIText } from "./ai.js";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    registerPushToken: protectedProcedure
      .input(z.object({ token: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserPushToken(ctx.user.id, input.token);
        return { success: true } as const;
      }),
    clearPushToken: protectedProcedure.mutation(async ({ ctx }) => {
      await updateUserPushToken(ctx.user.id, null);
      return { success: true } as const;
    }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => getUserProjects(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const project = await getProjectById(input.id);
      if (!project || project.userId !== ctx.user.id) throw new Error("Project not found");
      return project;
    }),
    create: protectedProcedure.input(z.object({ title: z.string().min(1), genre: z.string().optional(), logline: z.string().optional() })).mutation(async ({ ctx, input }) => createProject({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), genre: z.string().optional(), logline: z.string().optional(), status: z.enum(["draft","in_progress","completed","archived"]).optional() })).mutation(async ({ input }) => { const { id, ...data } = input; await updateProject(id, data); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await deleteProject(input.id); return { success: true }; }),
  }),

  scenes: router({
    list: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getProjectScenes(input.projectId)),
    create: protectedProcedure.input(z.object({ projectId: z.number(), title: z.string(), description: z.string().optional(), sceneNumber: z.number(), location: z.string().optional(), timeOfDay: z.string().optional() })).mutation(async ({ input }) => { await createScene(input); return { success: true }; }),
    update: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), description: z.string().optional(), location: z.string().optional(), status: z.enum(["draft","generating","ready","failed"]).optional(), videoUrl: z.string().optional() })).mutation(async ({ input }) => { const { id, ...data } = input; await updateScene(id, data); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await deleteScene(input.id); return { success: true }; }),
  }),

  characters: router({
    list: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getProjectCharacters(input.projectId)),
    create: protectedProcedure.input(z.object({ projectId: z.number(), name: z.string(), role: z.string().optional(), description: z.string().optional() })).mutation(async ({ input }) => { await createCharacter(input); return { success: true }; }),
  }),

  script: router({
    get: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getProjectScript(input.projectId)),
    save: protectedProcedure.input(z.object({ projectId: z.number(), content: z.string() })).mutation(async ({ input }) => { await saveScript(input.projectId, input.content); return { success: true }; }),
    generate: protectedProcedure.input(z.object({ projectId: z.number(), premise: z.string(), genre: z.string().optional(), tone: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 10) throw new Error("Insufficient credits");
      const prompt = `Write a professional screenplay for a ${input.genre || "drama"} film.\nPremise: ${input.premise}\nTone: ${input.tone || "dramatic"}\n\nFormat as proper screenplay with INT./EXT. headings, action lines, and dialogue. Include 3 acts.`;
      const content = await generateAIText(prompt);
      await saveScript(input.projectId, content);
      if (!isAdmin) await updateUserCredits(ctx.user.id, -10, "Script generation", "spend");
      return { content };
    }),
  }),

  storyboard: router({
    list: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getStoryboardPanels(input.projectId)),
    generatePanel: protectedProcedure.input(z.object({ projectId: z.number(), sceneId: z.number().optional(), panelNumber: z.number(), description: z.string(), cameraAngle: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 5) throw new Error("Insufficient credits");
      await createStoryboardPanel({ ...input, imageUrl: null });
      if (!isAdmin) await updateUserCredits(ctx.user.id, -5, "Storyboard panel", "spend");
      return { success: true };
    }),
  }),

  videos: router({
    list: protectedProcedure.query(async ({ ctx }) => getUserVideos(ctx.user.id)),
    projectVideos: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getProjectVideos(input.projectId)),
    generate: protectedProcedure.input(z.object({ prompt: z.string(), duration: z.number().default(4), projectId: z.number().optional(), sceneId: z.number().optional(), type: z.enum(["clip","trailer","film"]).default("clip") })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      const creditCost = input.duration * 5;
      if (!isAdmin && ctx.user.credits < creditCost) throw new Error("Insufficient credits");
      const videoId = await createVideo({ userId: ctx.user.id, projectId: input.projectId, sceneId: input.sceneId, prompt: input.prompt, duration: input.duration, type: input.type, status: "generating", creditsUsed: creditCost });
      if (!isAdmin) await updateUserCredits(ctx.user.id, -creditCost, `Video generation (${input.duration}s)`, "spend");
      return { videoId, status: "generating", creditsUsed: creditCost };
    }),
  }),

  chat: router({
    history: protectedProcedure.input(z.object({ projectId: z.number().optional() })).query(async ({ ctx, input }) => getChatHistory(ctx.user.id, input.projectId)),
    send: protectedProcedure.input(z.object({ message: z.string(), projectId: z.number().optional(), context: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 1) throw new Error("Insufficient credits");
      await saveChatMessage({ userId: ctx.user.id, projectId: input.projectId, role: "user", content: input.message });
      const systemPrompt = `You are the Virelle Studios AI Director — a world-class creative director and filmmaker. Help users develop their film projects with expert guidance on storytelling, cinematography, character development, and production. Be creative, inspiring, and specific.${input.context ? `\nProject context: ${input.context}` : ""}`;
      const response = await generateAIText(input.message, systemPrompt);
      await saveChatMessage({ userId: ctx.user.id, projectId: input.projectId, role: "assistant", content: response });
      if (!isAdmin) await updateUserCredits(ctx.user.id, -1, "Director chat", "spend");
      return { response };
    }),
  }),

  shotList: router({
    get: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getShotList(input.projectId)),
    generate: protectedProcedure.input(z.object({ projectId: z.number(), sceneDescription: z.string(), genre: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 5) throw new Error("Insufficient credits");
      const prompt = `Create a detailed shot list for this scene:\nScene: ${input.sceneDescription}\nGenre: ${input.genre || "drama"}\n\nReturn JSON array with: shotNumber, shotType, cameraAngle, description, duration, notes. Return only valid JSON.`;
      const content = await generateAIText(prompt);
      let shots;
      try { const m = content.match(/\[[\s\S]*\]/); shots = m ? JSON.parse(m[0]) : []; } catch { shots = []; }
      await saveShotList(input.projectId, shots);
      if (!isAdmin) await updateUserCredits(ctx.user.id, -5, "Shot list generation", "spend");
      return { shots };
    }),
  }),

  budget: router({
    get: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getBudgetEstimate(input.projectId)),
    generate: protectedProcedure.input(z.object({ projectId: z.number(), projectDescription: z.string(), sceneCount: z.number().optional(), genre: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 5) throw new Error("Insufficient credits");
      const prompt = `Create a detailed film production budget for:\nProject: ${input.projectDescription}\nGenre: ${input.genre || "drama"}\nScenes: ${input.sceneCount || "unknown"}\n\nReturn JSON: {totalBudget: number, lineItems: [{category, item, cost, notes}]}. Return only valid JSON.`;
      const content = await generateAIText(prompt);
      let budgetData;
      try { const m = content.match(/\{[\s\S]*\}/); budgetData = m ? JSON.parse(m[0]) : { totalBudget: 0, lineItems: [] }; } catch { budgetData = { totalBudget: 0, lineItems: [] }; }
      await saveBudgetEstimate(input.projectId, budgetData.lineItems, String(budgetData.totalBudget));
      if (!isAdmin) await updateUserCredits(ctx.user.id, -5, "Budget estimation", "spend");
      return budgetData;
    }),
  }),

  dialogue: router({
    enhance: protectedProcedure.input(z.object({ dialogue: z.string(), character: z.string().optional(), tone: z.string().optional(), context: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 3) throw new Error("Insufficient credits");
      const prompt = `Enhance this film dialogue to be more cinematic:\nCharacter: ${input.character || "Unknown"}\nTone: ${input.tone || "dramatic"}\n\nOriginal:\n${input.dialogue}\n\nProvide enhanced dialogue that sounds natural and reveals character.`;
      const enhanced = await generateAIText(prompt);
      if (!isAdmin) await updateUserCredits(ctx.user.id, -3, "Dialogue enhancement", "spend");
      return { enhanced };
    }),
  }),

  continuity: router({
    check: protectedProcedure.input(z.object({ projectId: z.number(), scriptContent: z.string().optional(), sceneDescriptions: z.array(z.string()).optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 8) throw new Error("Insufficient credits");
      const content = input.scriptContent || input.sceneDescriptions?.join("\n\n") || "";
      const prompt = `Analyze this film script for continuity errors:\n\n${content}\n\nReturn JSON: {issues: [{type, severity, description, scene}], score: 0-100, recommendations: [string]}. Return only valid JSON.`;
      const result = await generateAIText(prompt);
      let data;
      try { const m = result.match(/\{[\s\S]*\}/); data = m ? JSON.parse(m[0]) : { issues: [], score: 100, recommendations: [] }; } catch { data = { issues: [], score: 100, recommendations: [] }; }
      if (!isAdmin) await updateUserCredits(ctx.user.id, -8, "Continuity check", "spend");
      return data;
    }),
  }),

  subtitles: router({
    generate: protectedProcedure.input(z.object({ projectId: z.number(), scriptContent: z.string(), language: z.string().default("en") })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 5) throw new Error("Insufficient credits");
      const prompt = `Convert this screenplay to SRT subtitle format:\n\n${input.scriptContent}\n\nReturn valid SRT format with sequence numbers, timestamps (HH:MM:SS,mmm --> HH:MM:SS,mmm), and text.`;
      const srt = await generateAIText(prompt);
      if (!isAdmin) await updateUserCredits(ctx.user.id, -5, "Subtitle generation", "spend");
      return { srt };
    }),
  }),

  team: router({
    list: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getProjectTeam(input.projectId)),
    invite: protectedProcedure.input(z.object({ projectId: z.number(), email: z.string().email(), role: z.enum(["director","writer","editor","viewer"]) })).mutation(async ({ input }) => ({ success: true, message: `Invitation sent to ${input.email}` })),
  }),

  referrals: router({
    list: protectedProcedure.query(async ({ ctx }) => getReferralsByUser(ctx.user.id)),
    getCode: protectedProcedure.query(async ({ ctx }) => { const user = await getUserById(ctx.user.id); return { code: user?.referralCode || null }; }),
  }),

  credits: router({
    history: protectedProcedure.query(async ({ ctx }) => getCreditHistory(ctx.user.id)),
    balance: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      const tier = user?.subscriptionTier || "free";
      const totalCredits = user?.role === "admin" ? -1 : (TIER_MONTHLY_CREDITS[tier] ?? 0);
      return { credits: user?.role === "admin" ? -1 : (user?.credits || 0), totalCredits, isUnlimited: user?.role === "admin", tier };
    }),
  }),

  trailer: router({
    generate: protectedProcedure.input(z.object({ projectId: z.number(), style: z.string().optional(), duration: z.number().default(90) })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 50) throw new Error("Insufficient credits");
      const videoId = await createVideo({ userId: ctx.user.id, projectId: input.projectId, prompt: `Cinematic trailer, style: ${input.style || "dramatic"}`, duration: input.duration, type: "trailer", status: "generating", creditsUsed: 50 });
      if (!isAdmin) await updateUserCredits(ctx.user.id, -50, "Trailer generation", "spend");
      return { videoId, status: "generating" };
    }),
  }),

  film: router({
    generate: protectedProcedure.input(z.object({ projectId: z.number(), quality: z.enum(["draft","standard","high"]).default("standard") })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      const creditCost = input.quality === "high" ? 200 : input.quality === "standard" ? 100 : 50;
      if (!isAdmin && ctx.user.credits < creditCost) throw new Error("Insufficient credits");
      const videoId = await createVideo({ userId: ctx.user.id, projectId: input.projectId, prompt: `Full film, quality: ${input.quality}`, type: "film", status: "generating", creditsUsed: creditCost });
      if (!isAdmin) await updateUserCredits(ctx.user.id, -creditCost, "Film generation", "spend");
      return { videoId, status: "generating" };
    }),
  }),

  subscription: router({
    upgrade: protectedProcedure.input(z.object({ tier: z.string() })).mutation(async ({ ctx, input }) => {
      // TIER_MONTHLY_CREDITS is auto-generated — run `pnpm sync-mobile` in virellestudios to update
      const credits = TIER_MONTHLY_CREDITS[input.tier] ?? 100;
      await updateUserCredits(ctx.user.id, credits, `Upgraded to ${input.tier} plan`, "earn");
      return { success: true, tier: input.tier, credits };
    }),
    createCheckout: protectedProcedure
      .input(z.object({ tier: z.string(), billing: z.enum(["monthly", "annual"]).default("annual") }))
      .mutation(async ({ input }) => {
        // Redirect to the web Stripe checkout page — mobile handles this via deep link
        const baseUrl = process.env.APP_URL ?? "https://virellestudios.com";
        const url = `${baseUrl}/pricing?tier=${input.tier}&billing=${input.billing}&source=mobile`;
        return { url };
      }),
  }),

  filmPost: router({
    getMixSettings: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getMixSettings(input.projectId)),
    saveMixSettings: protectedProcedure.input(z.object({
      projectId: z.number(),
      dialogueBus: z.number().min(0).max(1).optional(),
      musicBus: z.number().min(0).max(1).optional(),
      effectsBus: z.number().min(0).max(1).optional(),
      masterVolume: z.number().min(0).max(1).optional(),
      reverbRoom: z.enum(["none","small","medium","large","hall","cathedral"]).optional(),
      reverbAmount: z.number().min(0).max(1).optional(),
      compressionRatio: z.number().min(1).max(20).optional(),
      noiseReduction: z.boolean().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => { const { projectId, ...data } = input; await saveMixSettings(projectId, data as any); return { success: true }; }),
    getAdrTracks: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getAdrTracks(input.projectId)),
    createAdrTrack: protectedProcedure.input(z.object({ projectId: z.number(), characterName: z.string(), dialogueLine: z.string().optional(), trackType: z.enum(["adr","wild_track","loop_group","walla"]).optional(), notes: z.string().optional() })).mutation(async ({ input }) => { await createAdrTrack(input as any); return { success: true }; }),
    updateAdrTrack: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["pending","recorded","approved","rejected"]).optional(), notes: z.string().optional(), dialogueLine: z.string().optional() })).mutation(async ({ input }) => { const { id, ...data } = input; await updateAdrTrack(id, data as any); return { success: true }; }),
    deleteAdrTrack: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await deleteAdrTrack(input.id); return { success: true }; }),
    getFoleyTracks: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getFoleyTracks(input.projectId)),
    createFoleyTrack: protectedProcedure.input(z.object({ projectId: z.number(), name: z.string(), foleyType: z.enum(["footsteps","cloth","props","impacts","environmental","custom"]).optional(), description: z.string().optional(), notes: z.string().optional() })).mutation(async ({ input }) => { await createFoleyTrack(input as any); return { success: true }; }),
    updateFoleyTrack: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["pending","recorded","approved","rejected"]).optional(), notes: z.string().optional() })).mutation(async ({ input }) => { const { id, ...data } = input; await updateFoleyTrack(id, data as any); return { success: true }; }),
    deleteFoleyTrack: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await deleteFoleyTrack(input.id); return { success: true }; }),
    getScoreCues: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => getScoreCues(input.projectId)),
    createScoreCue: protectedProcedure.input(z.object({ projectId: z.number(), title: z.string(), cueNumber: z.string().optional(), cueType: z.enum(["underscore","source_music","sting","theme","transition","silence"]).optional(), description: z.string().optional(), durationSeconds: z.number().optional(), notes: z.string().optional() })).mutation(async ({ input }) => { await createScoreCue(input as any); return { success: true }; }),
    updateScoreCue: protectedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), cueNumber: z.string().optional(), cueType: z.enum(["underscore","source_music","sting","theme","transition","silence"]).optional(), description: z.string().optional(), durationSeconds: z.number().optional(), notes: z.string().optional() })).mutation(async ({ input }) => { const { id, ...data } = input; await updateScoreCue(id, data as any); return { success: true }; }),
    deleteScoreCue: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await deleteScoreCue(input.id); return { success: true }; }),
    generateAdrSuggestions: protectedProcedure.input(z.object({ projectId: z.number(), context: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 5) throw new Error("Insufficient credits (5 required)");
      const project = await getProjectById(input.projectId);
      const projectScenes = await getProjectScenes(input.projectId);
      const scenesSummary = projectScenes.slice(0, 8).map((s, i) => `Scene ${i+1}: ${s.title} — ${s.description?.slice(0,100) || ""}`).join("\n");
      const prompt = `You are a professional ADR supervisor. Film: "${project?.title || "Untitled"}" Genre: ${project?.genre || "Drama"}\n\nScenes:\n${scenesSummary}\n\nIdentify 4-6 ADR needs. Return JSON: {"suggestions":[{"characterName":"...","dialogueLine":"...","trackType":"adr","notes":"..."}]}`;
      const content = await generateAIText(prompt);
      if (!isAdmin) await updateUserCredits(ctx.user.id, -5, "AI ADR suggestions", "spend");
      try { const m = content.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { suggestions: [] }; } catch { return { suggestions: [] }; }
    }),
    generateFoleySuggestions: protectedProcedure.input(z.object({ projectId: z.number(), context: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 5) throw new Error("Insufficient credits (5 required)");
      const project = await getProjectById(input.projectId);
      const projectScenes = await getProjectScenes(input.projectId);
      const scenesSummary = projectScenes.slice(0, 8).map((s, i) => `Scene ${i+1}: ${s.title} — ${s.description?.slice(0,100) || ""}`).join("\n");
      const prompt = `You are a professional Foley supervisor. Film: "${project?.title || "Untitled"}" Genre: ${project?.genre || "Drama"}\n\nScenes:\n${scenesSummary}\n\nIdentify 5-8 Foley tracks. Return JSON: {"suggestions":[{"name":"...","foleyType":"footsteps","description":"...","notes":"..."}]}`;
      const content = await generateAIText(prompt);
      if (!isAdmin) await updateUserCredits(ctx.user.id, -5, "AI Foley suggestions", "spend");
      try { const m = content.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { suggestions: [] }; } catch { return { suggestions: [] }; }
    }),
    generateScoreCues: protectedProcedure.input(z.object({ projectId: z.number(), style: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 8) throw new Error("Insufficient credits (8 required)");
      const project = await getProjectById(input.projectId);
      const projectScenes = await getProjectScenes(input.projectId);
      const scenesSummary = projectScenes.slice(0, 10).map((s, i) => `Scene ${i+1}: ${s.title} — ${s.description?.slice(0,100) || ""}`).join("\n");
      const prompt = `You are a professional film composer. Film: "${project?.title || "Untitled"}" Genre: ${project?.genre || "Drama"}${input.style ? ` Style: ${input.style}` : ""}\n\nScenes:\n${scenesSummary}\n\nCreate 5-8 score cues. Return JSON: {"cues":[{"cueNumber":"1M1","title":"...","cueType":"underscore","description":"...","duration":60,"notes":"..."}]}`;
      const content = await generateAIText(prompt);
      if (!isAdmin) await updateUserCredits(ctx.user.id, -8, "AI Score cues", "spend");
      try { const m = content.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { cues: [] }; } catch { return { cues: [] }; }
    }),
    exportMixSummary: protectedProcedure.input(z.object({ projectId: z.number() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 2) throw new Error("Insufficient credits (2 required)");
      const project = await getProjectById(input.projectId);
      const mixSettings = await getMixSettings(input.projectId);
      const adrList = await getAdrTracks(input.projectId);
      const foleyList = await getFoleyTracks(input.projectId);
      const cueList = await getScoreCues(input.projectId);
      if (!isAdmin) await updateUserCredits(ctx.user.id, -2, "Mix summary export", "spend");
      return {
        projectTitle: project?.title || "Untitled",
        exportedAt: new Date().toISOString(),
        mix: mixSettings,
        adr: { total: adrList.length, tracks: adrList },
        foley: { total: foleyList.length, tracks: foleyList },
        score: { total: cueList.length, cues: cueList },
      };
    }),
  }),

  funding: router({
    list: protectedProcedure.query(async ({ ctx }) => getFundingApplications(ctx.user.id)),
    create: protectedProcedure.input(z.object({ projectId: z.number().optional(), fundingOrganization: z.string(), projectTitle: z.string(), formData: z.any().optional() })).mutation(async ({ ctx, input }) => {
      await createFundingApplication({ ...input, userId: ctx.user.id });
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["draft","submitted","approved","rejected"]).optional(), formData: z.any().optional() })).mutation(async ({ input }) => { const { id, ...data } = input; await updateFundingApplication(id, data as any); return { success: true }; }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await deleteFundingApplication(input.id); return { success: true }; }),
    submit: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.user.role === "admin";
      if (!isAdmin && ctx.user.credits < 10) throw new Error("Insufficient credits (10 required)");
      await updateFundingApplication(input.id, { status: "submitted", submittedAt: new Date() });
      if (!isAdmin) await updateUserCredits(ctx.user.id, -10, "Funding application submit", "spend");
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
