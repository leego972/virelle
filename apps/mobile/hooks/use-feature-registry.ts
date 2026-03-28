/**
 * useFeatureRegistry
 *
 * Fetches the live feature registry from the Virelle Studios website server.
 * This is the mechanism that gives the mobile app automatic parity with the website:
 * any new feature added to shared/feature-registry.ts on the website will
 * automatically appear in the mobile app's All Tools screen.
 *
 * Falls back to a bundled snapshot if the network request fails.
 */

import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "@/constants/oauth";

export interface FeatureEntry {
  id: string;
  label: string;
  icon: string;
  category: string;
  webPath: string;
  description: string;
  minTier: "free" | "indie" | "amateur" | "independent" | "creator" | "studio" | "industry";
  hasNative: boolean;
  isNew?: boolean;
  isAdmin?: boolean;
}

export interface FeatureRegistry {
  version: number;
  updatedAt: string;
  features: FeatureEntry[];
  byCategory: Record<string, FeatureEntry[]>;
}

const CACHE_KEY = "virelle:feature_registry";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Bundled fallback — kept in sync with the website's feature-registry.ts
// This ensures the app works even offline or before the first network fetch.
const BUNDLED_REGISTRY: FeatureRegistry = {
  version: 1,
  updatedAt: "2026-03-17T00:00:00.000Z",
  features: [
    { id: "script-writer", label: "Script Writer", icon: "📝", category: "Writing", webPath: "/projects/:projectId/script", description: "AI-generated screenplay from a premise", minTier: "amateur", hasNative: true },
    { id: "dialogue", label: "Dialogue Enhancer", icon: "💬", category: "Writing", webPath: "/projects/:projectId/dialogue", description: "Improve character dialogue with AI", minTier: "amateur", hasNative: true },
    { id: "scene-builder", label: "Scene Builder", icon: "🎬", category: "Writing", webPath: "/projects/:id/scenes", description: "Build and manage individual scenes", minTier: "free", hasNative: true },
    { id: "director-chat", label: "Director Chat", icon: "🎭", category: "Writing", webPath: "/", description: "AI Director creative guidance", minTier: "free", hasNative: true },
    { id: "storyboard", label: "Storyboard", icon: "🖼️", category: "Visual", webPath: "/projects/:projectId/storyboard", description: "Visual panel-by-panel planning", minTier: "amateur", hasNative: true },
    { id: "mood-board", label: "Mood Board", icon: "🎨", category: "Visual", webPath: "/projects/:id/mood-board", description: "Visual tone and style references", minTier: "amateur", hasNative: false },
    { id: "color-grading", label: "Color Grading", icon: "🌈", category: "Visual", webPath: "/projects/:projectId/color-grading", description: "AI-assisted color grade your footage", minTier: "independent", hasNative: false },
    { id: "poster-maker", label: "Poster Maker", icon: "🖼", category: "Visual", webPath: "/poster-maker", description: "Generate cinematic film posters", minTier: "amateur", hasNative: false },
    { id: "video-generation", label: "Video Generation", icon: "🎥", category: "AI Video", webPath: "/projects/:id", description: "Generate AI video clips from prompts", minTier: "independent", hasNative: true },
    { id: "trailer", label: "Trailer Studio", icon: "🎞️", category: "AI Video", webPath: "/projects/:projectId/trailer-studio", description: "Create a cinematic film trailer", minTier: "creator", hasNative: true },
    { id: "film-generator", label: "Full Film Generator", icon: "🎦", category: "AI Video", webPath: "/projects/:projectId/director-cut", description: "Generate a complete short film", minTier: "creator", hasNative: true },
    { id: "multi-shot", label: "Multi-Shot Sequencer", icon: "🎬", category: "AI Video", webPath: "/projects/:projectId/multi-shot", description: "Chain multiple AI shots into sequences", minTier: "creator", hasNative: false },
    { id: "tv-commercial", label: "TV Commercial", icon: "📡", category: "AI Video", webPath: "/projects/:projectId/tv-commercial", description: "Generate broadcast-quality TV ads", minTier: "studio", hasNative: false },
    { id: "shot-list", label: "Shot List", icon: "📋", category: "Production", webPath: "/projects/:projectId/shot-list", description: "Camera shot breakdown per scene", minTier: "amateur", hasNative: true },
    { id: "budget", label: "Budget Estimator", icon: "💰", category: "Production", webPath: "/projects/:projectId/budget", description: "AI production cost breakdown", minTier: "independent", hasNative: true },
    { id: "characters", label: "Characters", icon: "👥", category: "Production", webPath: "/characters", description: "Manage cast and character profiles", minTier: "free", hasNative: true },
    { id: "ai-casting", label: "AI Casting", icon: "🎭", category: "Production", webPath: "/projects/:projectId/ai-casting", description: "AI-powered actor casting suggestions", minTier: "creator", hasNative: false },
    { id: "location-scout", label: "Location Scout", icon: "📍", category: "Production", webPath: "/projects/:id/locations", description: "AI location scouting and matching", minTier: "independent", hasNative: false },
    { id: "live-action-plate", label: "Live Action Plate", icon: "🎞", category: "Production", webPath: "/projects/:projectId/live-action-plate", description: "Composite AI video with live footage", minTier: "studio", hasNative: false },
    { id: "subtitles", label: "Subtitle Generator", icon: "📺", category: "Post-Production", webPath: "/projects/:id/subtitles", description: "Auto-generate SRT subtitles", minTier: "amateur", hasNative: true },
    { id: "continuity", label: "Continuity Checker", icon: "🔍", category: "Post-Production", webPath: "/projects/:projectId/continuity", description: "Find script inconsistencies", minTier: "independent", hasNative: true },
    { id: "nle-export", label: "NLE Export", icon: "🖥️", category: "Post-Production", webPath: "/projects/:projectId/nle-export", description: "Export to Premiere, DaVinci, Final Cut", minTier: "creator", hasNative: false },
    { id: "vfx-suite", label: "VFX Suite", icon: "✨", category: "Post-Production", webPath: "/projects/:projectId/vfx-suite", description: "AI visual effects and compositing", minTier: "studio", hasNative: false },
    { id: "sound-effects", label: "Sound Effects", icon: "🔊", category: "Post-Production", webPath: "/projects/:id/sound-effects", description: "AI sound design and effects", minTier: "independent", hasNative: false },
    { id: "visual-effects", label: "Visual Effects", icon: "🌟", category: "Post-Production", webPath: "/projects/:id/visual-effects", description: "AI-generated visual effects", minTier: "independent", hasNative: false },
    { id: "team", label: "Team Collaboration", icon: "🤝", category: "Management", webPath: "/projects/:id/collaboration", description: "Invite and manage collaborators", minTier: "creator", hasNative: true },
    { id: "credits-editor", label: "Credits Editor", icon: "🎬", category: "Management", webPath: "/projects/:projectId/credits", description: "Edit film credits and end titles", minTier: "amateur", hasNative: false },
    { id: "marketplace", label: "Asset Marketplace", icon: "🛒", category: "Management", webPath: "/marketplace", description: "Buy and sell production assets", minTier: "free", hasNative: false },
    { id: "content-creator", label: "Content Creator", icon: "📱", category: "Management", webPath: "/content-creator", description: "Social media content generation", minTier: "amateur", hasNative: false },
    { id: "subscription", label: "Subscription Plans", icon: "⭐", category: "Account", webPath: "/pricing", description: "Upgrade your plan", minTier: "free", hasNative: true },
    { id: "credits", label: "Credits", icon: "💳", category: "Account", webPath: "/credits", description: "View balance and transaction history", minTier: "free", hasNative: true },
    { id: "referrals", label: "Referral Program", icon: "🎁", category: "Account", webPath: "/referrals", description: "Earn credits by referring friends", minTier: "free", hasNative: true },
    { id: "settings", label: "Settings", icon: "⚙️", category: "Account", webPath: "/settings", description: "Account and app settings", minTier: "free", hasNative: false },
  ],
  byCategory: {},
};

// Pre-build the byCategory map on the bundled registry
BUNDLED_REGISTRY.byCategory = BUNDLED_REGISTRY.features.reduce((acc, f) => {
  if (!acc[f.category]) acc[f.category] = [];
  acc[f.category].push(f);
  return acc;
}, {} as Record<string, FeatureEntry[]>);

export function useFeatureRegistry() {
  const [registry, setRegistry] = useState<FeatureRegistry>(BUNDLED_REGISTRY);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRegistry() {
      // Try cache first
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { data: FeatureRegistry; fetchedAt: number };
          if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
            if (!cancelled) {
              setRegistry(parsed.data);
              setLastFetched(new Date(parsed.fetchedAt));
            }
            return;
          }
        }
      } catch (_) {
        // Cache miss — continue to network fetch
      }

      // Network fetch
      setLoading(true);
      try {
        const baseUrl = getApiBaseUrl();
        if (!baseUrl) return; // No URL configured yet

        const res = await fetch(`${baseUrl}/api/mobile/features`, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: FeatureRegistry = await res.json();

        if (!cancelled) {
          setRegistry(data);
          setLastFetched(new Date());
        }

        // Cache the result
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
      } catch (err) {
        // Network failed — keep using bundled/cached registry silently
        console.warn("[FeatureRegistry] Using bundled fallback:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRegistry();
    return () => { cancelled = true; };
  }, []);

  return { registry, loading, lastFetched };
}
