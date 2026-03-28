import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import {
  TIER_DISPLAY_NAMES,
  TIER_MONTHLY_CREDITS,
  TIER_PRICING,
} from "@/shared/_core/subscription-constants";

// Tier colour map — visual only, not in shared constants
const TIER_COLORS: Record<string, string> = {
  free:        "#6B7280",
  indie:       "#F59E0B",
  amateur:     "#8B5CF6",
  independent: "#3B82F6",
  creator:     "#10B981",
  studio:      "#F59E0B",
  industry:    "#EF4444",
  beta:        "#EC4899",
};

function formatAUD(cents: number): string {
  return `A$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 0 })}`;
}

function getTierPrice(tierId: string): string {
  if (tierId === "free") return "Free";
  const pricing = (TIER_PRICING as Record<string, { monthly: number }>)[tierId];
  if (!pricing) return "Custom";
  return `${formatAUD(pricing.monthly)}/mo`;
}

function getTierCredits(tierId: string): string {
  const credits = TIER_MONTHLY_CREDITS[tierId] ?? 0;
  if (credits === 0) return "100 credits";
  return `${credits.toLocaleString()} credits/mo`;
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, logout } = useAuth({ autoFetch: true });
  const { data: creditsData } = trpc.credits.balance.useQuery();
  const { data: referralData } = trpc.referrals.getCode.useQuery();
  const { data: creditHistory } = trpc.credits.history.useQuery();

  const currentTierId = creditsData?.tier ?? "free";
  const currentTierName = TIER_DISPLAY_NAMES[currentTierId] ?? "Free";
  const currentTierColor = TIER_COLORS[currentTierId] ?? "#6B7280";

  const handleShareReferral = async () => {
    if (!referralData?.code) return;
    try {
      await Share.share({
        message: `Join Virelle Studios — the AI-powered film production platform! Use my referral code ${referralData.code} to get 7,000 bonus credits when you sign up. https://virellestudios.com`,
        title: "Join Virelle Studios",
      });
    } catch (_e) {
      // User cancelled
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name ?? "User"}</Text>
            <Text style={[styles.userEmail, { color: colors.muted }]}>{user?.email ?? ""}</Text>
            {user?.role === "admin" && (
              <View style={[styles.adminBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.adminText, { color: colors.primary }]}>Admin</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Subscription */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Subscription</Text>
            <View style={[styles.subscriptionCard, { backgroundColor: colors.surface, borderColor: currentTierColor }]}>
              <View style={styles.subscriptionHeader}>
                <View>
                  <Text style={[styles.tierName, { color: currentTierColor }]}>{currentTierName}</Text>
                  <Text style={[styles.tierPrice, { color: colors.foreground }]}>{getTierPrice(currentTierId)}</Text>
                </View>
                <View style={styles.creditsDisplay}>
                  <Text style={[styles.creditsValue, { color: colors.primary }]}>
                    {creditsData?.isUnlimited ? "∞" : creditsData?.credits ?? 0}
                  </Text>
                  <Text style={[styles.creditsLabel, { color: colors.muted }]}>credits</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/tool/subscription" as never)}
              >
                <Text style={styles.upgradeText}>
                  {currentTierId === "industry" ? "Manage Plan" : "Upgrade Plan"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Referral */}
          {referralData?.code && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Referral Program</Text>
              <View style={[styles.referralCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.referralDesc, { color: colors.muted }]}>
                  Share your code and earn 7,000 credits for each friend who joins. They get 7,000 credits too!
                </Text>
                <View style={[styles.codeBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                  <Text style={[styles.codeText, { color: colors.foreground }]}>{referralData.code}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: colors.primary }]}
                  onPress={handleShareReferral}
                >
                  <Text style={styles.shareButtonText}>Share Referral Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Credit History */}
          {creditHistory && creditHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Credit History</Text>
              <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {creditHistory.slice(0, 5).map((tx: any) => (
                  <View key={tx.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyDesc, { color: colors.foreground }]}>{tx.description}</Text>
                      <Text style={[styles.historyDate, { color: colors.muted }]}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.historyAmount, { color: tx.amount > 0 ? colors.success : colors.error }]}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Settings</Text>
            <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                { label: "Subscription Plans", icon: "💳", route: "/tool/subscription" },
                { label: "Referral Program", icon: "🎁", route: "/tool/referrals" },
                { label: "Credit History", icon: "📊", route: "/tool/credits" },
                { label: "Notification Settings", icon: "🔔", route: "/tool/notifications" },
                { label: "Privacy Policy", icon: "🔒", route: "/tool/privacy" },
                { label: "Terms of Service", icon: "📄", route: "/tool/terms" },
              ].map((item, index, arr) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.settingsRow, index < arr.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}
                  onPress={() => router.push(item.route as never)}
                >
                  <Text style={styles.settingsIcon}>{item.icon}</Text>
                  <Text style={[styles.settingsLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.settingsArrow, { color: colors.muted }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: colors.error }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  userCard: { flexDirection: "row", alignItems: "center", gap: 16, margin: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontWeight: "700" },
  userEmail: { fontSize: 13 },
  adminBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  adminText: { fontSize: 11, fontWeight: "700" },
  content: { paddingHorizontal: 16, gap: 24 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  subscriptionCard: { borderRadius: 16, borderWidth: 2, padding: 16, gap: 14 },
  subscriptionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tierName: { fontSize: 14, fontWeight: "700", textTransform: "uppercase" },
  tierPrice: { fontSize: 20, fontWeight: "700", marginTop: 2 },
  creditsDisplay: { alignItems: "flex-end" },
  creditsValue: { fontSize: 28, fontWeight: "700" },
  creditsLabel: { fontSize: 12 },
  upgradeButton: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  upgradeText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  referralCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  referralDesc: { fontSize: 13, lineHeight: 20 },
  codeBox: { borderRadius: 10, borderWidth: 1, padding: 12, alignItems: "center" },
  codeText: { fontSize: 20, fontWeight: "700", letterSpacing: 4 },
  shareButton: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  shareButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  historyCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  historyRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 0.5 },
  historyInfo: { flex: 1 },
  historyDesc: { fontSize: 14 },
  historyDate: { fontSize: 12, marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: "700" },
  settingsCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  settingsRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  settingsIcon: { fontSize: 18, width: 28, textAlign: "center" },
  settingsLabel: { flex: 1, fontSize: 15 },
  settingsArrow: { fontSize: 20 },
  logoutButton: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, alignItems: "center" },
  logoutText: { fontSize: 16, fontWeight: "600" },
});
