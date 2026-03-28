import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GENRES = ["Drama", "Thriller", "Comedy", "Horror", "Sci-Fi", "Romance", "Action", "Documentary", "Animation"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:       { label: "Draft",       color: "#94A3B8", bg: "#94A3B820" },
  in_progress: { label: "In Progress", color: "#F59E0B", bg: "#F59E0B20" },
  completed:   { label: "Completed",   color: "#22C55E", bg: "#22C55E20" },
  archived:    { label: "Archived",    color: "#6B7280", bg: "#6B728020" },
};

// Deterministic gradient colour pairs per project ID
const THUMB_GRADIENTS = [
  ["#7C3AED", "#4F46E5"],
  ["#DB2777", "#9333EA"],
  ["#0EA5E9", "#6366F1"],
  ["#F59E0B", "#EF4444"],
  ["#10B981", "#0EA5E9"],
  ["#EC4899", "#F97316"],
];

function getThumbColors(id: number) {
  return THUMB_GRADIENTS[id % THUMB_GRADIENTS.length];
}

const GENRE_ICONS: Record<string, string> = {
  Drama: "🎭", Thriller: "🔪", Comedy: "😄", Horror: "👻",
  "Sci-Fi": "🚀", Romance: "💕", Action: "💥", Documentary: "📽️", Animation: "✨",
};

export default function ProjectsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [logline, setLogline] = useState("");
  const [search, setSearch] = useState("");

  const { data: projects, refetch, isLoading } = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      setShowCreate(false);
      setTitle("");
      setGenre("");
      setLogline("");
      refetch();
    },
  });
  const deleteMutation = trpc.projects.delete.useMutation({ onSuccess: () => refetch() });

  const filtered = (projects ?? []).filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!title.trim()) return;
    createMutation.mutate({ title: title.trim(), genre: genre || undefined, logline: logline || undefined });
  };

  const handleDelete = (id: number, projectTitle: string) => {
    Alert.alert("Delete Project", `Delete "${projectTitle}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerEyebrow, { color: colors.muted }]}>VIRELLE STUDIOS</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Projects</Text>
        </View>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreate(true)}
        >
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.muted, marginRight: 8, fontSize: 16 }}>⌕</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search projects..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      {!isLoading && (projects?.length ?? 0) > 0 && (
        <View style={[styles.statsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{projects?.length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#F59E0B" }]}>
              {projects?.filter(p => p.status === "in_progress").length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Active</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: "#22C55E" }]}>
              {projects?.filter(p => p.status === "completed").length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Done</Text>
          </View>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading projects...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface }]}>
                <Text style={styles.emptyIcon}>🎬</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {search ? "No matching projects" : "No Projects Yet"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                {search
                  ? "Try a different search term"
                  : "Create your first film project to get started with AI-powered production"}
              </Text>
              {!search && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowCreate(true)}
                >
                  <Text style={styles.emptyButtonText}>Create Your First Project</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const [c1, c2] = getThumbColors(item.id);
            const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
            const genreIcon = GENRE_ICONS[item.genre ?? ""] ?? "🎬";
            return (
              <TouchableOpacity
                style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/project/${item.id}` as never)}
                onLongPress={() => handleDelete(item.id, item.title)}
                activeOpacity={0.75}
              >
                {/* Thumbnail */}
                <View style={[styles.projectThumb, { backgroundColor: c1 }]}>
                  {/* Simulated gradient via overlay */}
                  <View style={[styles.thumbOverlay, { backgroundColor: c2 }]} />
                  <Text style={styles.projectThumbIcon}>{genreIcon}</Text>
                </View>

                {/* Info */}
                <View style={styles.projectInfo}>
                  <Text style={[styles.projectTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.projectGenre, { color: colors.muted }]}>
                    {item.genre || "No genre"}
                  </Text>
                  {item.logline ? (
                    <Text style={[styles.projectLogline, { color: colors.muted }]} numberOfLines={2}>
                      {item.logline}
                    </Text>
                  ) : null}
                </View>

                {/* Meta */}
                <View style={styles.projectMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  <Text style={[styles.arrow, { color: colors.muted }]}>›</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={[styles.modalCancel, { color: colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Project</Text>
            <TouchableOpacity onPress={handleCreate} disabled={!title.trim() || createMutation.isPending}>
              <Text style={[styles.modalSave, { color: title.trim() ? colors.primary : colors.muted }]}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>TITLE *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="My Film Project"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>GENRE</Text>
              <View style={styles.genreGrid}>
                {GENRES.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genreChip,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      genre === g && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setGenre(genre === g ? "" : g)}
                  >
                    <Text style={styles.genreChipIcon}>{GENRE_ICONS[g] ?? "🎬"}</Text>
                    <Text style={[styles.genreText, { color: genre === g ? "#fff" : colors.foreground }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>LOGLINE</Text>
              <TextInput
                style={[styles.fieldTextarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                placeholder="A one-sentence summary of your film..."
                placeholderTextColor={colors.muted}
                value={logline}
                onChangeText={setLogline}
                multiline
                numberOfLines={3}
              />
              <Text style={[styles.fieldHint, { color: colors.muted }]}>
                A great logline is 1–2 sentences that capture the core conflict.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  headerEyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  newButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  newButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 15 },
  statsBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 10, fontWeight: "600", marginTop: 1, letterSpacing: 0.5 },
  statDivider: { width: 1, marginVertical: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyButton: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  emptyButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  projectCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  projectThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 28,
    height: 56,
    opacity: 0.5,
  },
  projectThumbIcon: { fontSize: 26 },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  projectGenre: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  projectLogline: { fontSize: 12, marginTop: 5, lineHeight: 17 },
  projectMeta: { alignItems: "flex-end", gap: 8 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  arrow: { fontSize: 22, fontWeight: "300" },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
  },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalSave: { fontSize: 16, fontWeight: "700" },
  modalContent: { padding: 20, gap: 24 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  fieldInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
  },
  fieldTextarea: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 90,
  },
  fieldHint: { fontSize: 12, lineHeight: 17 },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  genreChipIcon: { fontSize: 13 },
  genreText: { fontSize: 13, fontWeight: "600" },
});
