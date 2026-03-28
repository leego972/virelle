import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const STATUS_ICONS: Record<string, string> = {
  generating: "⏳",
  ready: "✅",
  failed: "❌",
  draft: "📝",
};

const TYPE_LABELS: Record<string, string> = {
  clip: "Clip",
  trailer: "Trailer",
  film: "Full Film",
};

export default function MoviesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data: videos, isLoading, refetch } = trpc.videos.list.useQuery();

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Movies</Text>
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/tool/video-generation" as never)}
        >
          <Text style={styles.generateButtonText}>+ Generate</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={videos ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎥</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Videos Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Generate your first AI video from a project or prompt
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/tool/video-generation" as never)}
              >
                <Text style={styles.emptyButtonText}>Generate Video</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.videoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.videoThumb, { backgroundColor: colors.surface2 }]}>
                <Text style={styles.videoThumbIcon}>
                  {item.status === "ready" ? "▶️" : STATUS_ICONS[item.status] ?? "🎬"}
                </Text>
              </View>
              <View style={styles.videoInfo}>
                <Text style={[styles.videoPrompt, { color: colors.foreground }]} numberOfLines={2}>
                  {item.prompt}
                </Text>
                <View style={styles.videoMeta}>
                  <View style={[styles.typeBadge, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.typeText, { color: colors.primary }]}>
                      {TYPE_LABELS[item.type] ?? item.type}
                    </Text>
                  </View>
                  {item.duration ? (
                    <Text style={[styles.duration, { color: colors.muted }]}>{item.duration}s</Text>
                  ) : null}
                  <Text style={[styles.status, { color: colors.muted }]}>
                    {STATUS_ICONS[item.status]} {item.status}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  generateButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  generateButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  videoCard: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", gap: 12 },
  videoThumb: { width: 72, height: 72, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  videoThumbIcon: { fontSize: 28 },
  videoInfo: { flex: 1, gap: 8 },
  videoPrompt: { fontSize: 14, lineHeight: 20 },
  videoMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: "600" },
  duration: { fontSize: 12 },
  status: { fontSize: 12 },
});
