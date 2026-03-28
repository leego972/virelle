import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useOfflineDraft } from "@/hooks/use-offline-draft";

const GENRES = ["Drama", "Thriller", "Comedy", "Horror", "Sci-Fi", "Romance", "Action", "Documentary"];
const TONES = ["Dramatic", "Dark", "Comedic", "Inspirational", "Suspenseful", "Romantic", "Epic"];

export default function ScriptWriterScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [premise, setPremise] = useState("");
  const [genre, setGenre] = useState("Drama");
  const [tone, setTone] = useState("Dramatic");
  const [script, setScript] = useState("");
  const [editing, setEditing] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const { isOnline, saveDraft, loadDraft, markSynced } = useOfflineDraft();

  const { data: existingScript } = trpc.script.get.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const generateMutation = trpc.script.generate.useMutation({
    onSuccess: (data) => {
      setScript(data.content);
      setEditing(true);
      // Save to offline cache immediately
      if (projectId) saveDraft(projectId, "script", data.content);
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const saveMutation = trpc.script.save.useMutation({
    onSuccess: () => {
      Alert.alert("Saved", "Script saved successfully!");
      if (projectId) markSynced(projectId, "script");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  // Load offline draft on mount if no server data yet
  useEffect(() => {
    if (!projectId || draftRestored) return;
    loadDraft(projectId, "script").then((draft) => {
      if (draft && !existingScript?.content) {
        setScript(draft.content as string);
        setEditing(true);
        setDraftRestored(true);
        Alert.alert(
          "Draft Restored",
          `An offline draft from ${new Date(draft.savedAt).toLocaleString()} was restored.`,
          [{ text: "OK" }]
        );
      }
    });
  }, [projectId, existingScript]);

  // Auto-save draft whenever script content changes
  const handleScriptChange = useCallback((text: string) => {
    setScript(text);
    if (projectId) saveDraft(projectId, "script", text);
  }, [projectId]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline || !projectId) return;
    const currentContent = script || existingScript?.content;
    if (!currentContent) return;
    loadDraft(projectId, "script").then((draft) => {
      if (draft && !draft.synced) {
        saveMutation.mutate({ projectId, content: draft.content as string });
      }
    });
  }, [isOnline]);

  const handleGenerate = () => {
    if (!premise.trim()) {
      Alert.alert("Required", "Please enter a premise for your film.");
      return;
    }
    if (!projectId) {
      Alert.alert("No Project", "Please select a project first.");
      return;
    }
    generateMutation.mutate({ projectId, premise, genre, tone });
  };

  const displayScript = script || existingScript?.content || "";

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Script Writer</Text>
        {displayScript ? (
          <TouchableOpacity
            onPress={() => projectId && saveMutation.mutate({ projectId, content: displayScript })}
            disabled={saveMutation.isPending || !isOnline}
          >
            <Text style={[styles.saveText, { color: isOnline ? colors.primary : colors.muted }]}>
              {saveMutation.isPending ? "Saving..." : isOnline ? "Save" : "Offline"}
            </Text>
          </TouchableOpacity>
        ) : <View style={{ width: 48 }} />}
      </View>

      {/* Offline indicator */}
      {!isOnline && (
        <View style={[styles.offlineBanner, { backgroundColor: "#7c3a00" }]}>
          <Text style={styles.offlineText}>⚡ Offline — changes saved locally and will sync when reconnected</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {/* Premise Input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Film Premise *</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="A retired detective discovers her missing daughter is connected to a secret government program..."
            placeholderTextColor={colors.muted}
            value={premise}
            onChangeText={setPremise}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Genre */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Genre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, { borderColor: colors.border }, genre === g && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setGenre(g)}
                >
                  <Text style={[styles.chipText, { color: genre === g ? "#fff" : colors.foreground }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tone */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Tone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {TONES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, { borderColor: colors.border }, tone === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setTone(t)}
                >
                  <Text style={[styles.chipText, { color: tone === t ? "#fff" : colors.foreground }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Credit Cost Info */}
        <View style={[styles.costInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.costText, { color: colors.muted }]}>
            💳 Script generation costs 10 credits. Admins have unlimited access.
          </Text>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.primary }, (generateMutation.isPending || !isOnline) && { opacity: 0.7 }]}
          onPress={handleGenerate}
          disabled={generateMutation.isPending || !isOnline}
        >
          {generateMutation.isPending ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.generateText}>Generating Script...</Text>
            </View>
          ) : (
            <Text style={styles.generateText}>
              {!isOnline ? "Offline — Connect to Generate" : displayScript ? "Regenerate Script" : "Generate Script"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Script Output */}
        {displayScript ? (
          <View style={styles.scriptContainer}>
            <View style={styles.scriptHeader}>
              <Text style={[styles.scriptTitle, { color: colors.foreground }]}>
                Generated Script {!isOnline ? "(Draft)" : ""}
              </Text>
              <TouchableOpacity onPress={() => setEditing(!editing)}>
                <Text style={[styles.editToggle, { color: colors.primary }]}>
                  {editing ? "View" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>
            {editing ? (
              <TextInput
                style={[styles.scriptEditor, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                value={displayScript}
                onChangeText={handleScriptChange}
                multiline
                textAlignVertical="top"
              />
            ) : (
              <View style={[styles.scriptView, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.scriptText, { color: colors.foreground }]}>{displayScript}</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  saveText: { fontSize: 16, fontWeight: "600" },
  offlineBanner: { paddingHorizontal: 16, paddingVertical: 8 },
  offlineText: { color: "#fbbf24", fontSize: 12, textAlign: "center" },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  costInfo: { borderRadius: 10, borderWidth: 1, padding: 12 },
  costText: { fontSize: 13, lineHeight: 18 },
  generateButton: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  loadingRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  generateText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  scriptContainer: { gap: 10 },
  scriptHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scriptTitle: { fontSize: 16, fontWeight: "600" },
  editToggle: { fontSize: 14 },
  scriptEditor: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 13, minHeight: 400, textAlignVertical: "top", fontFamily: "monospace" },
  scriptView: { borderRadius: 12, borderWidth: 1, padding: 14 },
  scriptText: { fontSize: 13, lineHeight: 22, fontFamily: "monospace" },
});
