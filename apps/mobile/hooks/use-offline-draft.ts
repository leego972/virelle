import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export type DraftType = "script" | "storyboard";

interface Draft {
  projectId: number;
  type: DraftType;
  content: unknown;
  savedAt: string; // ISO timestamp
  synced: boolean;
}

const DRAFT_KEY = (projectId: number, type: DraftType) =>
  `virelle:draft:${type}:${projectId}`;

const PENDING_SYNC_KEY = "virelle:pending_sync";

/**
 * Manages offline drafts for scripts and storyboards.
 *
 * - Saves content to AsyncStorage immediately on every change
 * - Tracks network connectivity
 * - Exposes a `syncPending` function to push all unsynced drafts to the server
 * - Returns `isOnline`, `hasPendingDrafts`, and `pendingCount`
 */
export function useOfflineDraft() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Monitor network state
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });
    return () => unsubscribe();
  }, []);

  // Count pending drafts on mount
  useEffect(() => {
    refreshPendingCount();
  }, []);

  async function refreshPendingCount() {
    try {
      const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const pending: string[] = raw ? JSON.parse(raw) : [];
      setPendingCount(pending.length);
    } catch {
      setPendingCount(0);
    }
  }

  /**
   * Save a draft locally. Marks it as unsynced and adds it to the pending queue.
   */
  const saveDraft = useCallback(async (projectId: number, type: DraftType, content: unknown) => {
    try {
      const draft: Draft = {
        projectId,
        type,
        content,
        savedAt: new Date().toISOString(),
        synced: false,
      };
      const key = DRAFT_KEY(projectId, type);
      await AsyncStorage.setItem(key, JSON.stringify(draft));

      // Add to pending sync queue
      const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const pending: string[] = raw ? JSON.parse(raw) : [];
      if (!pending.includes(key)) {
        pending.push(key);
        await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
      }
      await refreshPendingCount();
    } catch (error) {
      console.warn("[OfflineDraft] Failed to save draft:", error);
    }
  }, []);

  /**
   * Load a draft from local storage.
   */
  const loadDraft = useCallback(async (projectId: number, type: DraftType): Promise<Draft | null> => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY(projectId, type));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Mark a draft as synced and remove it from the pending queue.
   */
  const markSynced = useCallback(async (projectId: number, type: DraftType) => {
    try {
      const key = DRAFT_KEY(projectId, type);
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const draft: Draft = JSON.parse(raw);
        draft.synced = true;
        await AsyncStorage.setItem(key, JSON.stringify(draft));
      }
      // Remove from pending queue
      const pendingRaw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const pending: string[] = pendingRaw ? JSON.parse(pendingRaw) : [];
      const updated = pending.filter((k) => k !== key);
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updated));
      await refreshPendingCount();
    } catch (error) {
      console.warn("[OfflineDraft] Failed to mark synced:", error);
    }
  }, []);

  /**
   * Get all pending (unsynced) drafts.
   */
  const getPendingDrafts = useCallback(async (): Promise<Draft[]> => {
    try {
      const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const keys: string[] = raw ? JSON.parse(raw) : [];
      const drafts: Draft[] = [];
      for (const key of keys) {
        const draftRaw = await AsyncStorage.getItem(key);
        if (draftRaw) {
          const draft: Draft = JSON.parse(draftRaw);
          if (!draft.synced) drafts.push(draft);
        }
      }
      return drafts;
    } catch {
      return [];
    }
  }, []);

  /**
   * Delete a draft from local storage.
   */
  const deleteDraft = useCallback(async (projectId: number, type: DraftType) => {
    try {
      const key = DRAFT_KEY(projectId, type);
      await AsyncStorage.removeItem(key);
      const pendingRaw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      const pending: string[] = pendingRaw ? JSON.parse(pendingRaw) : [];
      const updated = pending.filter((k) => k !== key);
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updated));
      await refreshPendingCount();
    } catch (error) {
      console.warn("[OfflineDraft] Failed to delete draft:", error);
    }
  }, []);

  return {
    isOnline,
    pendingCount,
    hasPendingDrafts: pendingCount > 0,
    saveDraft,
    loadDraft,
    markSynced,
    getPendingDrafts,
    deleteDraft,
    refreshPendingCount,
  };
}
