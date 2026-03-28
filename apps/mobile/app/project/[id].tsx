import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const PRODUCTION_TOOLS = [
  { id: "script-writer", label: "Script Writer", icon: "📝", description: "AI-generated screenplay" },
  { id: "storyboard", label: "Storyboard", icon: "🖼️", description: "Visual scene planning" },
  { id: "shot-list", label: "Shot List", icon: "📋", description: "Camera shot breakdown" },
  { id: "video-generation", label: "Video Generation", icon: "🎥", description: "Generate video clips" },
  { id: "trailer", label: "Trailer", icon: "🎞️", description: "Create a film trailer" },
  { id: "dialogue", label: "Dialogue Enhancer", icon: "💬", description: "Improve character dialogue" },
  { id: "budget", label: "Budget Estimator", icon: "💰", description: "Production cost breakdown" },
  { id: "continuity", label: "Continuity Checker", icon: "🔍", description: "Find script inconsistencies" },
  { id: "subtitles", label: "Subtitles · 130+ Languages", icon: "📺", description: "Auto-generate subtitles" },
  { id: "scene-builder", label: "Scene Builder", icon: "🎬", description: "Build individual scenes" },
  { id: "characters", label: "Characters", icon: "👥", description: "Manage cast & characters" },
  { id: "film-post-production", label: "Film Post-Production", icon: "🎚", description: "ADR · Foley · Score · Mix" },
  { id: "funding-directory", label: "Funding Directory", icon: "🌍", description: "94 funders · Apply from app" },
  { id: "team", label: "Team", icon: "🤝", description: "Invite collaborators" },
];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const projectId = Number(id);

  const { data: project, isLoading } = trpc.projects.get.useQuery({ id: projectId });
  const updateMutation = trpc.projects.update.useMutation();
  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => router.back(),
  });

  const handleDelete = () => {
    Alert.alert("Delete Project", `Delete "${project?.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id: projectId }) },
    ]);
  };

  const handleToolPress = (toolId: string) => {
    router.push(`/tool/${toolId}?projectId=${projectId}` as never);
  };

  if (isLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!project) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>Project not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>‹ Projects</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={[styles.deleteText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Project Info */}
        <View style={[styles.projectHeader, { borderBottomColor: colors.border }]}>
          <View style={[styles.projectThumb, { backgroundColor: colors.surface }]}>
            <Text style={styles.projectThumbIcon}>🎬</Text>
          </View>
          <Text style={[styles.projectTitle, { color: colors.foreground }]}>{project.title}</Text>
          {project.genre && (
            <View style={[styles.genreBadge, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.genreText, { color: colors.primary }]}>{project.genre}</Text>
            </View>
          )}
          {project.logline && (
            <Text style={[styles.logline, { color: colors.muted }]}>{project.logline}</Text>
          )}

          {/* Status Selector */}
          <View style={styles.statusRow}>
            {["draft", "in_progress", "completed"].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  { borderColor: colors.border },
                  project.status === s && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => updateMutation.mutate({ id: projectId, status: s as "draft" | "in_progress" | "completed" | "archived" })}
              >
                <Text style={[styles.statusText, { color: project.status === s ? "#fff" : colors.muted }]}>
                  {s.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Production Tools Grid */}
        <View style={styles.toolsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Production Tools</Text>
          <View style={styles.toolsGrid}>
            {PRODUCTION_TOOLS.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleToolPress(tool.id)}
              >
                <Text style={styles.toolIcon}>{tool.icon}</Text>
                <Text style={[styles.toolLabel, { color: colors.foreground }]}>{tool.label}</Text>
                <Text style={[styles.toolDesc, { color: colors.muted }]}>{tool.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 16 },
  backLink: { fontSize: 15 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  backButton: {},
  backText: { fontSize: 16 },
  deleteText: { fontSize: 14 },
  projectHeader: { alignItems: "center", padding: 24, gap: 10, borderBottomWidth: 0.5 },
  projectThumb: { width: 80, height: 80, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  projectThumbIcon: { fontSize: 36 },
  projectTitle: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  genreBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  genreText: { fontSize: 13, fontWeight: "600" },
  logline: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
  statusRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: "500", textTransform: "capitalize" },
  toolsSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  toolsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  toolCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 6 },
  toolIcon: { fontSize: 28 },
  toolLabel: { fontSize: 14, fontWeight: "600" },
  toolDesc: { fontSize: 11, lineHeight: 16 },
});
