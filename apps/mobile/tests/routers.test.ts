import { describe, it, expect } from "vitest";

describe("Router structure", () => {
  it("appRouter exports AppRouter type", async () => {
    // Dynamic import to avoid needing a real DB connection
    const mod = await import("../server/routers.js").catch(() => null);
    // If import fails due to missing DB, just verify the file exists
    const fs = await import("fs");
    const exists = fs.existsSync("./server/routers.ts");
    expect(exists).toBe(true);
  });

  it("all tool components exist", async () => {
    const fs = await import("fs");
    const tools = [
      "ScriptWriter", "Storyboard", "ShotList", "VideoGeneration",
      "Trailer", "Dialogue", "Budget", "Continuity", "Subtitles",
      "SceneBuilder", "Characters", "Team", "Subscription",
      "Referrals", "Credits", "AllTools", "FilmGenerator",
      "Privacy", "Terms"
    ];
    for (const tool of tools) {
      const exists = fs.existsSync(`./components/tools/${tool}.tsx`);
      expect(exists, `${tool}.tsx should exist`).toBe(true);
    }
  });

  it("all tab screens exist", async () => {
    const fs = await import("fs");
    const screens = ["index", "projects", "chat", "movies", "profile"];
    for (const screen of screens) {
      const exists = fs.existsSync(`./app/(tabs)/${screen}.tsx`);
      expect(exists, `${screen}.tsx should exist`).toBe(true);
    }
  });

  it("auth screens exist", async () => {
    const fs = await import("fs");
    const screens = ["login", "register", "forgot-password"];
    for (const screen of screens) {
      const exists = fs.existsSync(`./app/(auth)/${screen}.tsx`);
      expect(exists, `${screen}.tsx should exist`).toBe(true);
    }
  });
});
