import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Tab = "adr" | "foley" | "score" | "mix";

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  recorded: "#3B82F6",
  approved: "#22C55E",
  rejected: "#EF4444",
};

export default function FilmPostProductionScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("adr");

  // ── ADR ──────────────────────────────────────────────────────────────────────
  const adrQuery = trpc.filmPost.getAdrTracks.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const createAdr = trpc.filmPost.createAdrTrack.useMutation({
    onSuccess: () => adrQuery.refetch(),
    onError: (e) => Alert.alert("Error", e.message),
  });
  const updateAdr = trpc.filmPost.updateAdrTrack.useMutation({
    onSuccess: () => adrQuery.refetch(),
    onError: (e) => Alert.alert("Error", e.message),
  });
  const deleteAdr = trpc.filmPost.deleteAdrTrack.useMutation({
    onSuccess: () => adrQuery.refetch(),
    onError: (e) => Alert.alert("Error", e.message),
  });
  const genAdr = trpc.filmPost.generateAdrSuggestions.useMutation({
    onSuccess: (data) => {
      if (!projectId) return;
      const suggestions = (data as any).suggestions || [];
      suggestions.forEach((s: any) => {
        createAdr.mutate({ projectId, characterName: s.characterName, dialogueLine: s.dialogueLine, trackType: s.trackType, notes: s.notes });
      });
      Alert.alert("AI ADR", `${suggestions.length} suggestions added.`);
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  // ── Foley ─────────────────────────────────────────────────────────────────────
  const foleyQuery = trpc.filmPost.getFoleyTracks.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const createFoley = trpc.filmPost.createFoleyTrack.useMutation({
    onSuccess: () => foleyQuery.refetch(),
    onError: (e) => Alert.alert("Error", e.message),
  });
  const updateFoley = trpc.filmPost.updateFoleyTrack.useMutation({
    onSuccess: () => foleyQuery.refetch(),
    onError: (e) => Alert.alert("Error", e.message),
  });
  const deleteFoley = trpc.filmPost.deleteFoleyTrack.useMutation({
    onSuccess: () => foleyQuery.refetch(),
    onError: (e) => Alert.alert("Error", e.message),
  });
  const genFoley = trpc.filmPost.generateFoleySuggestions.useMutation({
    onSuccess: (data) => {
      if (!projectId) return;
      const suggestions = (data as any).suggestions || [];
      suggestions.forEach((s: any) => {
        createFoley.mutate({ projectId, name: s.name, foleyType: s.foleyType, description: s.description, notes: s.notes });
      });
      Alert.alert("AI Foley", `${suggestions.length} suggestions added.`);
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  // ── Score ─────────────────────────────────────────────────────────────────────
  const scoreQuery = trpc.filmPost.getScoreCues.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const createScore = trpc.filmPost.createScoreCue.useMutation({
    onSuccess: () => scoreQuery.refetch(),
    onError: (e) => Alert.alert("Error", e.message),
  });
  const deleteScore = trpc.filmPost.deleteScoreCue.useMutation({
    onSuccess: () => scoreQuery.refetch(),
    onError: (e) => Alert.alert("Error", e.message),
  });
  const genScore = trpc.filmPost.generateScoreCues.useMutation({
    onSuccess: (data) => {
      if (!projectId) return;
      const cues = (data as any).cues || [];
      cues.forEach((c: any) => {
        createScore.mutate({ projectId, title: c.title, cueNumber: c.cueNumber, cueType: c.cueType, description: c.description, durationSeconds: c.duration, notes: c.notes });
      });
      Alert.alert("AI Score", `${cues.length} cues added.`);
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  // ── Mix ───────────────────────────────────────────────────────────────────────
  const mixQuery = trpc.filmPost.getMixSettings.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const saveMix = trpc.filmPost.saveMixSettings.useMutation({
    onSuccess: () => mixQuery.refetch(),
    onError: (e) => Alert.alert("Error", e.message),
  });
  const exportMix = trpc.filmPost.exportMixSummary.useMutation({
    onSuccess: (data) => {
      const d = data as any;
      Alert.alert(
        "Mix Export",
        `Project: ${d.projectTitle}\nADR: ${d.adr?.total || 0} tracks\nFoley: ${d.foley?.total || 0} tracks\nScore: ${d.score?.total || 0} cues\n\nExported at ${new Date(d.exportedAt).toLocaleString()}`,
      );
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  // ── Add ADR modal state ───────────────────────────────────────────────────────
  const [showAddAdr, setShowAddAdr] = useState(false);
  const [adrChar, setAdrChar] = useState("");
  const [adrLine, setAdrLine] = useState("");

  // ── Add Foley modal state ─────────────────────────────────────────────────────
  const [showAddFoley, setShowAddFoley] = useState(false);
  const [foleyName, setFoleyName] = useState("");
  const [foleyDesc, setFoleyDesc] = useState("");

  // ── Add Score modal state ─────────────────────────────────────────────────────
  const [showAddScore, setShowAddScore] = useState(false);
  const [scoreTitle, setScoreTitle] = useState("");
  const [scoreCueNum, setScoreCueNum] = useState("");
  const [scoreDesc, setScoreDesc] = useState("");

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "adr", label: "ADR", icon: "🎙" },
    { key: "foley", label: "Foley", icon: "👣" },
    { key: "score", label: "Score", icon: "🎼" },
    { key: "mix", label: "Mix", icon: "🎚" },
  ];

  const mix = mixQuery.data as any;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Film Post-Production</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t.key)}
          >
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabLabel, { color: tab === t.key ? colors.primary : colors.muted }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ADR Tab ── */}
      {tab === "adr" && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ADR Tracks</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={[styles.aiBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => { if (!projectId) return; genAdr.mutate({ projectId }); }}
                disabled={genAdr.isPending || !projectId}
              >
                {genAdr.isPending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.aiBtnText, { color: colors.primary }]}>✨ AI Suggest (5cr)</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAddAdr(true)}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {adrQuery.isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
          {(adrQuery.data as any[])?.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>🎙</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No ADR tracks yet. Use AI Suggest or add manually.</Text>
            </View>
          )}
          {(adrQuery.data as any[] || []).map((track: any) => (
            <View key={track.id} style={[styles.trackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.trackHeader}>
                <Text style={[styles.trackChar, { color: colors.foreground }]}>{track.characterName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[track.status] + "22" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[track.status] }]}>{track.status}</Text>
                </View>
              </View>
              <Text style={[styles.trackLine, { color: colors.muted }]} numberOfLines={2}>{track.dialogueLine || "—"}</Text>
              <Text style={[styles.trackType, { color: colors.primary }]}>{track.trackType?.replace("_", " ").toUpperCase()}</Text>
              {track.notes ? <Text style={[styles.trackNotes, { color: colors.muted }]}>{track.notes}</Text> : null}
              <View style={styles.trackActions}>
                {track.status === "pending" && (
                  <TouchableOpacity style={[styles.statusBtn, { borderColor: "#22C55E" }]} onPress={() => updateAdr.mutate({ id: track.id, status: "recorded" })}>
                    <Text style={{ color: "#22C55E", fontSize: 12 }}>Mark Recorded</Text>
                  </TouchableOpacity>
                )}
                {track.status === "recorded" && (
                  <TouchableOpacity style={[styles.statusBtn, { borderColor: "#3B82F6" }]} onPress={() => updateAdr.mutate({ id: track.id, status: "approved" })}>
                    <Text style={{ color: "#3B82F6", fontSize: 12 }}>Approve</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.statusBtn, { borderColor: colors.error }]} onPress={() => Alert.alert("Delete", "Remove this ADR track?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteAdr.mutate({ id: track.id }) }])}>
                  <Text style={{ color: colors.error, fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Foley Tab ── */}
      {tab === "foley" && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Foley Tracks</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={[styles.aiBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => { if (!projectId) return; genFoley.mutate({ projectId }); }}
                disabled={genFoley.isPending || !projectId}
              >
                {genFoley.isPending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.aiBtnText, { color: colors.primary }]}>✨ AI Suggest (5cr)</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAddFoley(true)}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {foleyQuery.isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
          {(foleyQuery.data as any[])?.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>👣</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No Foley tracks yet. Use AI Suggest or add manually.</Text>
            </View>
          )}
          {(foleyQuery.data as any[] || []).map((track: any) => (
            <View key={track.id} style={[styles.trackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.trackHeader}>
                <Text style={[styles.trackChar, { color: colors.foreground }]}>{track.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[track.status] + "22" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[track.status] }]}>{track.status}</Text>
                </View>
              </View>
              <Text style={[styles.trackType, { color: colors.primary }]}>{track.foleyType?.toUpperCase()}</Text>
              {track.description ? <Text style={[styles.trackLine, { color: colors.muted }]} numberOfLines={2}>{track.description}</Text> : null}
              {track.notes ? <Text style={[styles.trackNotes, { color: colors.muted }]}>{track.notes}</Text> : null}
              <View style={styles.trackActions}>
                {track.status === "pending" && (
                  <TouchableOpacity style={[styles.statusBtn, { borderColor: "#22C55E" }]} onPress={() => updateFoley.mutate({ id: track.id, status: "recorded" })}>
                    <Text style={{ color: "#22C55E", fontSize: 12 }}>Mark Recorded</Text>
                  </TouchableOpacity>
                )}
                {track.status === "recorded" && (
                  <TouchableOpacity style={[styles.statusBtn, { borderColor: "#3B82F6" }]} onPress={() => updateFoley.mutate({ id: track.id, status: "approved" })}>
                    <Text style={{ color: "#3B82F6", fontSize: 12 }}>Approve</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.statusBtn, { borderColor: colors.error }]} onPress={() => Alert.alert("Delete", "Remove this Foley track?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteFoley.mutate({ id: track.id }) }])}>
                  <Text style={{ color: colors.error, fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Score Tab ── */}
      {tab === "score" && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Score Cues</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={[styles.aiBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => { if (!projectId) return; genScore.mutate({ projectId }); }}
                disabled={genScore.isPending || !projectId}
              >
                {genScore.isPending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.aiBtnText, { color: colors.primary }]}>✨ AI Generate (8cr)</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAddScore(true)}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {scoreQuery.isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
          {(scoreQuery.data as any[])?.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>🎼</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No score cues yet. Use AI Generate or add manually.</Text>
            </View>
          )}
          {(scoreQuery.data as any[] || []).map((cue: any) => (
            <View key={cue.id} style={[styles.trackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.trackHeader}>
                <Text style={[styles.trackChar, { color: colors.foreground }]}>{cue.cueNumber} — {cue.title}</Text>
                <Text style={[styles.cueDuration, { color: colors.muted }]}>{cue.durationSeconds || 0}s</Text>
              </View>
              <Text style={[styles.trackType, { color: colors.primary }]}>{cue.cueType?.replace("_", " ").toUpperCase()}</Text>
              {cue.description ? <Text style={[styles.trackLine, { color: colors.muted }]} numberOfLines={2}>{cue.description}</Text> : null}
              {cue.notes ? <Text style={[styles.trackNotes, { color: colors.muted }]}>{cue.notes}</Text> : null}
              <View style={styles.trackActions}>
                <TouchableOpacity style={[styles.statusBtn, { borderColor: colors.error }]} onPress={() => Alert.alert("Delete", "Remove this cue?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteScore.mutate({ id: cue.id }) }])}>
                  <Text style={{ color: colors.error, fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Mix Tab ── */}
      {tab === "mix" && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 16 }]}>Three-Bus Mix Panel</Text>

          {/* Bus Levels */}
          {[
            { label: "Dialogue Bus", key: "dialogueBus", value: Number(mix?.dialogueBus ?? 0.85) },
            { label: "Music Bus", key: "musicBus", value: Number(mix?.musicBus ?? 0.70) },
            { label: "Effects Bus", key: "effectsBus", value: Number(mix?.effectsBus ?? 0.75) },
            { label: "Master Volume", key: "masterVolume", value: Number(mix?.masterVolume ?? 1.0) },
          ].map((bus) => (
            <View key={bus.key} style={[styles.busCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.busHeader}>
                <Text style={[styles.busLabel, { color: colors.foreground }]}>{bus.label}</Text>
                <Text style={[styles.busValue, { color: colors.primary }]}>{Math.round(bus.value * 100)}%</Text>
              </View>
              <View style={[styles.busTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.busFill, { backgroundColor: colors.primary, width: `${bus.value * 100}%` as any }]} />
              </View>
              <View style={styles.busButtons}>
                {[0.5, 0.7, 0.85, 1.0].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.busPreset, { backgroundColor: Math.abs(bus.value - v) < 0.01 ? colors.primary : colors.border }]}
                    onPress={() => { if (!projectId) return; saveMix.mutate({ projectId, [bus.key]: v }); }}
                  >
                    <Text style={{ color: Math.abs(bus.value - v) < 0.01 ? "#fff" : colors.muted, fontSize: 11 }}>{Math.round(v * 100)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Reverb */}
          <View style={[styles.busCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.busLabel, { color: colors.foreground, marginBottom: 10 }]}>Reverb Room</Text>
            <View style={styles.reverbRow}>
              {(["none","small","medium","large","hall","cathedral"] as const).map((room) => (
                <TouchableOpacity
                  key={room}
                  style={[styles.reverbBtn, { backgroundColor: mix?.reverbRoom === room ? colors.primary : colors.border }]}
                  onPress={() => { if (!projectId) return; saveMix.mutate({ projectId, reverbRoom: room }); }}
                >
                  <Text style={{ color: mix?.reverbRoom === room ? "#fff" : colors.muted, fontSize: 11 }}>{room}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Noise Reduction */}
          <View style={[styles.busCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.busHeader}>
              <Text style={[styles.busLabel, { color: colors.foreground }]}>Noise Reduction</Text>
              <TouchableOpacity
                style={[styles.toggle, { backgroundColor: mix?.noiseReduction ? colors.primary : colors.border }]}
                onPress={() => { if (!projectId) return; saveMix.mutate({ projectId, noiseReduction: !mix?.noiseReduction }); }}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{mix?.noiseReduction ? "ON" : "OFF"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Export */}
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.primary }, (exportMix.isPending || !projectId) && { opacity: 0.7 }]}
            onPress={() => { if (!projectId) return; exportMix.mutate({ projectId }); }}
            disabled={exportMix.isPending || !projectId}
          >
            {exportMix.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.exportBtnText}>Export Mix Summary (2 credits)</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Add ADR Modal ── */}
      <Modal visible={showAddAdr} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddAdr(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddAdr(false)}><Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add ADR Track</Text>
            <TouchableOpacity onPress={() => {
              if (!projectId || !adrChar.trim()) { Alert.alert("Required", "Character name is required."); return; }
              createAdr.mutate({ projectId, characterName: adrChar.trim(), dialogueLine: adrLine.trim() });
              setAdrChar(""); setAdrLine(""); setShowAddAdr(false);
            }}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Character Name *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} value={adrChar} onChangeText={setAdrChar} placeholder="e.g. DETECTIVE MORGAN" placeholderTextColor={colors.muted} returnKeyType="next" />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Dialogue Line</Text>
              <TextInput style={[styles.input, styles.inputMulti, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} value={adrLine} onChangeText={setAdrLine} placeholder="The line that needs re-recording..." placeholderTextColor={colors.muted} multiline numberOfLines={3} />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Add Foley Modal ── */}
      <Modal visible={showAddFoley} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddFoley(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddFoley(false)}><Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Foley Track</Text>
            <TouchableOpacity onPress={() => {
              if (!projectId || !foleyName.trim()) { Alert.alert("Required", "Track name is required."); return; }
              createFoley.mutate({ projectId, name: foleyName.trim(), description: foleyDesc.trim() });
              setFoleyName(""); setFoleyDesc(""); setShowAddFoley(false);
            }}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Track Name *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} value={foleyName} onChangeText={setFoleyName} placeholder="e.g. Hero's boots on cobblestone" placeholderTextColor={colors.muted} returnKeyType="next" />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Description</Text>
              <TextInput style={[styles.input, styles.inputMulti, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} value={foleyDesc} onChangeText={setFoleyDesc} placeholder="When and where this sound occurs..." placeholderTextColor={colors.muted} multiline numberOfLines={3} />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Add Score Modal ── */}
      <Modal visible={showAddScore} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddScore(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddScore(false)}><Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Score Cue</Text>
            <TouchableOpacity onPress={() => {
              if (!projectId || !scoreTitle.trim()) { Alert.alert("Required", "Cue title is required."); return; }
              createScore.mutate({ projectId, title: scoreTitle.trim(), cueNumber: scoreCueNum.trim() || "TBD", description: scoreDesc.trim() });
              setScoreTitle(""); setScoreCueNum(""); setScoreDesc(""); setShowAddScore(false);
            }}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Cue Number</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} value={scoreCueNum} onChangeText={setScoreCueNum} placeholder="e.g. 1M1" placeholderTextColor={colors.muted} returnKeyType="next" />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Cue Title *</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} value={scoreTitle} onChangeText={setScoreTitle} placeholder="e.g. The Arrival" placeholderTextColor={colors.muted} returnKeyType="next" />
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Description</Text>
              <TextInput style={[styles.input, styles.inputMulti, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} value={scoreDesc} onChangeText={setScoreDesc} placeholder="Emotional direction for the composer..." placeholderTextColor={colors.muted} multiline numberOfLines={3} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: "600" },
  tabBar: { flexDirection: "row", borderBottomWidth: 0.5 },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 2 },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 11, fontWeight: "600" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  aiBtn: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  aiBtnText: { fontSize: 12, fontWeight: "600" },
  addBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  trackCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  trackHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trackChar: { fontSize: 15, fontWeight: "600", flex: 1 },
  trackLine: { fontSize: 13, lineHeight: 18 },
  trackType: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  trackNotes: { fontSize: 12, fontStyle: "italic" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  trackActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  statusBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  cueDuration: { fontSize: 12 },
  busCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  busHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  busLabel: { fontSize: 14, fontWeight: "600" },
  busValue: { fontSize: 14, fontWeight: "700" },
  busTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  busFill: { height: 6, borderRadius: 3 },
  busButtons: { flexDirection: "row", gap: 6 },
  busPreset: { flex: 1, borderRadius: 8, paddingVertical: 5, alignItems: "center" },
  reverbRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reverbBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  toggle: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 },
  exportBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  exportBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
});
