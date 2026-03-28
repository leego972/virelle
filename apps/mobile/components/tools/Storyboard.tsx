import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useOfflineDraft } from "@/hooks/use-offline-draft";

const ANGLES = ["Wide Shot", "Medium Shot", "Close-up", "Extreme Close-up", "Over-the-shoulder", "POV", "Aerial"];

interface LocalPanel {
  id: string;
  panelNumber: number;
  description: string;
  cameraAngle: string;
  isLocal: boolean;
}

export default function StoryboardScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [cameraAngle, setCameraAngle] = useState("Wide Shot");
  const [panelNumber, setPanelNumber] = useState(1);
  const [localPanels, setLocalPanels] = useState<LocalPanel[]>([]);

  const { isOnline, saveDraft, loadDraft, markSynced } = useOfflineDraft();

  const { data: serverPanels, refetch } = trpc.storyboard.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const generateMutation = trpc.storyboard.generatePanel.useMutation({
    onSuccess: () => {
      refetch();
      setDescription("");
      setPanelNumber((n) => n + 1);
      // Clear local draft after successful server save
      if (projectId) markSynced(projectId, "storyboard");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  // Load offline panels on mount
  useEffect(() => {
    if (!projectId) return;
    loadDraft(projectId, "storyboard").then((draft) => {
      if (draft && Array.isArray(draft.content) && draft.content.length > 0) {
        const panels = draft.content as LocalPanel[];
        setLocalPanels(panels);
        setPanelNumber(panels.length + 1);
      }
    });
  }, [projectId]);

  // Sync local panels when coming back online
  useEffect(() => {
    if (!isOnline || !projectId || localPanels.length === 0) return;
    loadDraft(projectId, "storyboard").then(async (draft) => {
      if (!draft || draft.synced) return;
      const panels = draft.content as LocalPanel[];
      // Submit each unsynced local panel
      for (const panel of panels) {
        await generateMutation.mutateAsync({
          projectId,
          panelNumber: panel.panelNumber,
          description: panel.description,
          cameraAngle: panel.cameraAngle,
        }).catch(() => null);
      }
      setLocalPanels([]);
      markSynced(projectId, "storyboard");
    });
  }, [isOnline]);

  const handleAddPanel = () => {
    if (!description.trim() || !projectId) return;

    if (!isOnline) {
      // Save locally
      const newPanel: LocalPanel = {
        id: `local-${Date.now()}`,
        panelNumber,
        description,
        cameraAngle,
        isLocal: true,
      };
      const updated = [...localPanels, newPanel];
      setLocalPanels(updated);
      saveDraft(projectId, "storyboard", updated);
      setDescription("");
      setPanelNumber((n) => n + 1);
      Alert.alert("Saved Offline", "Panel saved locally. It will sync when you reconnect.");
    } else {
      generateMutation.mutate({ projectId, panelNumber, description, cameraAngle });
    }
  };

  // Merge server panels with local-only panels
  type MergedPanel = { panelNumber: number; description: string | null; cameraAngle: string | null; isLocal: boolean; id: string | number };
  const allPanels: MergedPanel[] = [
    ...(serverPanels || []).map((p): MergedPanel => ({ id: p.id, panelNumber: p.panelNumber, description: p.description ?? null, cameraAngle: p.cameraAngle ?? null, isLocal: false })),
    ...localPanels.filter((lp) => !(serverPanels || []).some((sp) => sp.panelNumber === lp.panelNumber)).map((lp): MergedPanel => ({ id: lp.id, panelNumber: lp.panelNumber, description: lp.description, cameraAngle: lp.cameraAngle, isLocal: true })),
  ].sort((a, b) => a.panelNumber - b.panelNumber);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Storyboard</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: "#7c3a00" }]}>
          <Text style={styles.offlineText}>
            ⚡ Offline — panels saved locally ({localPanels.length} pending sync)
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {allPanels.length > 0 && (
          <View style={styles.panelsGrid}>
            {allPanels.map((panel) => (
              <View
                key={String(panel.id)}
                style={[
                  styles.panelCard,
                  { backgroundColor: colors.surface, borderColor: panel.isLocal ? "#b45309" : colors.border },
                ]}
              >
                <View style={[styles.panelThumb, { backgroundColor: colors.surface }]}>
                  <Text style={styles.panelIcon}>🖼️</Text>
                  <Text style={[styles.panelNum, { color: colors.muted }]}>
                    Panel {panel.panelNumber}{panel.isLocal ? " (local)" : ""}
                  </Text>
                </View>
                <Text style={[styles.panelDesc, { color: colors.foreground }]} numberOfLines={2}>
                  {panel.description}
                </Text>
                <Text style={[styles.panelAngle, { color: colors.muted }]}>{panel.cameraAngle}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Panel {panelNumber} Description</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Describe what happens in this panel..."
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Camera Angle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {ANGLES.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, { borderColor: colors.border }, cameraAngle === a && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setCameraAngle(a)}
                >
                  <Text style={[styles.chipText, { color: cameraAngle === a ? "#fff" : colors.foreground }]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, generateMutation.isPending && { opacity: 0.7 }]}
          onPress={handleAddPanel}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {isOnline ? "Add Panel (5 credits)" : "Save Panel Offline"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: "600" },
  offlineBanner: { paddingHorizontal: 16, paddingVertical: 8 },
  offlineText: { color: "#fbbf24", fontSize: 12, textAlign: "center" },
  panelsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  panelCard: { width: "47%", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  panelThumb: { height: 80, alignItems: "center", justifyContent: "center" },
  panelIcon: { fontSize: 24 },
  panelNum: { fontSize: 11 },
  panelDesc: { fontSize: 12, padding: 8 },
  panelAngle: { fontSize: 11, paddingHorizontal: 8, paddingBottom: 8 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: "500" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
