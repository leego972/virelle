import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Quick Action Tools ───────────────────────────────────────────────────────
const QUICK_TOOLS = [
  { id: "director-chat",   label: "Director Chat",   icon: "🎬", route: "/(tabs)/chat",              color: "#8B5CF6" },
  { id: "script-writer",   label: "Script Writer",   icon: "📝", route: "/tool/script-writer",       color: "#3B82F6" },
  { id: "storyboard",      label: "Storyboard",      icon: "🎨", route: "/tool/storyboard",          color: "#F59E0B" },
  { id: "video-gen",       label: "Video Gen",       icon: "🎥", route: "/tool/video-generation",    color: "#EF4444" },
  { id: "voice-acting",    label: "Voice Acting",    icon: "🎙️", route: "/tool/voice-acting",        color: "#10B981" },
  { id: "film-score",      label: "Film Score",      icon: "🎵", route: "/tool/film-score",          color: "#EC4899" },
];

// ─── Production Stats ─────────────────────────────────────────────────────────
const PLATFORM_STATS = [
  { label: "AI Models", value: "35+" },
  { label: "Languages", value: "130+" },
  { label: "Voice Styles", value: "3,000+" },
  { label: "Film Tools", value: "30+" },
];

// ─── Subscription tier display names ─────────────────────────────────────────
const TIER_LABELS: Record<string, { name: string; color: string }> = {
  free:        { name: "Free",       color: "#6B7280" },
  indie:       { name: "Indie",      color: "#10B981" },
  amateur:     { name: "Creator",    color: "#F59E0B" },
  independent: { name: "Studio",     color: "#8B5CF6" },
  studio:      { name: "Production", color: "#3B82F6" },
  industry:    { name: "Enterprise", color: "#EF4444" },
  creator:     { name: "Creator",    color: "#F59E0B" },
  beta:        { name: "Beta",       color: "#6B7280" },
  // Legacy aliases
  beginner:    { name: "Indie",      color: "#10B981" },
};

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth({ autoFetch: true });
  const { data: creditsData } = trpc.credits.balance.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();

  const recentProjects = projects?.slice(0, 3) ?? [];
  const tier = TIER_LABELS[creditsData?.tier ?? "free"] ?? TIER_LABELS.free;
  const creditPct = creditsData?.isUnlimited
    ? 100
    : Math.min(100, Math.round(((creditsData?.credits ?? 0) / (creditsData?.totalCredits ?? 1)) * 100));

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.muted }]}>Welcome back</Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>
              {user?.name || "Director"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/tool/subscription" as never)}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>

          {/* ── Credits & Plan Card ────────────────────────────────────────── */}
          <View style={[styles.creditsCard, { backgroundColor: colors.surface, borderColor: tier.color + "40" }]}>
            {/* Top row: tier badge + upgrade button */}
            <View style={styles.creditsTopRow}>
              <View style={[styles.tierBadge, { backgroundColor: tier.color + "20" }]}>
                <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                <Text style={[styles.tierText, { color: tier.color }]}>{tier.name} Plan</Text>
              </View>
              {creditsData?.tier === "free" || !creditsData?.tier ? (
                <TouchableOpacity
                  style={[styles.upgradeButton, { backgroundColor: tier.color }]}
                  onPress={() => router.push("/tool/subscription" as never)}
                >
                  <Text style={styles.upgradeText}>Upgrade</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.manageButton, { borderColor: colors.border }]}
                  onPress={() => router.push("/tool/subscription" as never)}
                >
                  <Text style={[styles.manageText, { color: colors.muted }]}>Manage</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Credits value */}
            <View style={styles.creditsValueRow}>
              <Text style={[styles.creditsValue, { color: colors.foreground }]}>
                {creditsData?.isUnlimited ? "∞" : (creditsData?.credits ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.creditsLabel, { color: colors.muted }]}>
                {creditsData?.isUnlimited ? "Unlimited Credits" : "credits remaining"}
              </Text>
            </View>

            {/* Progress bar */}
            {!creditsData?.isUnlimited && (
              <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${creditPct}%` as any, backgroundColor: creditPct > 20 ? tier.color : "#EF4444" },
                  ]}
                />
              </View>
            )}
          </View>

          {/* ── Platform Stats ─────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            {PLATFORM_STATS.map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Quick Actions ──────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {QUICK_TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(tool.route as never)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.quickIconWrap, { backgroundColor: tool.color + "20" }]}>
                    <Text style={styles.quickIcon}>{tool.icon}</Text>
                  </View>
                  <Text style={[styles.quickLabel, { color: colors.foreground }]}>{tool.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Recent Projects ────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Projects</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/projects" as never)}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
              </TouchableOpacity>
            </View>

            {recentProjects.length === 0 ? (
              <TouchableOpacity
                style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push("/(tabs)/projects" as never)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Start Your First Film</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  Create a project and bring your vision to life with AI
                </Text>
                <View style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
                  <Text style={styles.emptyButtonText}>New Project</Text>
                </View>
              </TouchableOpacity>
            ) : (
              recentProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/project/${project.id}` as never)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.projectThumb, { backgroundColor: colors.surface2 }]}>
                    <Text style={styles.projectThumbIcon}>🎬</Text>
                  </View>
                  <View style={styles.projectInfo}>
                    <Text style={[styles.projectTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={[styles.projectMeta, { color: colors.muted }]}>
                      {project.genre || "No genre"} · {project.status}
                    </Text>
                  </View>
                  <Text style={[styles.projectArrow, { color: colors.muted }]}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ── All Tools CTA ──────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.allToolsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push("/tool/all-tools" as never)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={[styles.allToolsTitle, { color: colors.foreground }]}>All Production Tools</Text>
              <Text style={[styles.allToolsSubtitle, { color: colors.muted }]}>
                30+ AI tools for every stage of filmmaking
              </Text>
            </View>
            <Text style={[styles.allToolsArrow, { color: colors.primary }]}>→</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  greeting: { fontSize: 13 },
  userName: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  headerLogo: { width: 38, height: 38 },

  content: { padding: 20, gap: 24 },

  // Credits card
  creditsCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    gap: 14,
  },
  creditsTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tierDot: { width: 7, height: 7, borderRadius: 4 },
  tierText: { fontSize: 12, fontWeight: "700" },
  upgradeButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  upgradeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  manageButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  manageText: { fontSize: 13, fontWeight: "600" },
  creditsValueRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  creditsValue: { fontSize: 36, fontWeight: "800" },
  creditsLabel: { fontSize: 13 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 15, fontWeight: "800" },
  statLabel: { fontSize: 10, textAlign: "center" },

  // Sections
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  seeAll: { fontSize: 13, fontWeight: "600" },

  // Quick tools
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: {
    width: (SCREEN_WIDTH - 60) / 3,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },

  // Empty state
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Project cards
  projectCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  projectThumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  projectThumbIcon: { fontSize: 22 },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 15, fontWeight: "700" },
  projectMeta: { fontSize: 12, marginTop: 2 },
  projectArrow: { fontSize: 22 },

  // All tools
  allToolsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  allToolsTitle: { fontSize: 16, fontWeight: "700" },
  allToolsSubtitle: { fontSize: 12, marginTop: 3 },
  allToolsArrow: { fontSize: 24, fontWeight: "700" },
});
