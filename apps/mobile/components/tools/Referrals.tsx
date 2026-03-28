import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
export default function ReferralsScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const { data: referralData, isLoading } = trpc.referrals.getCode.useQuery();
  const history: Array<{ referredUser?: { name?: string } }> = [];
  const handleShare = async () => {
    if (!referralData?.code) return;
    await Share.share({ message: `Join Virelle Studios — the AI film production platform! Use my code ${referralData.code} to get 25 bonus credits. https://virellestudios.com`, title: "Join Virelle Studios" });
  };
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Referral Program</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.heroIcon}>🎁</Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Earn Credits by Referring</Text>
          <Text style={[styles.heroDesc, { color: colors.muted }]}>Earn 50 credits for each friend who joins Virelle Studios using your referral code. Your friend gets 25 bonus credits too!</Text>
        </View>
        {isLoading ? <ActivityIndicator color={colors.primary} /> : referralData?.code ? (
          <View style={[styles.codeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.codeLabel, { color: colors.muted }]}>Your Referral Code</Text>
            <Text style={[styles.code, { color: colors.primary }]}>{referralData.code}</Text>
            <Text style={[styles.usesText, { color: colors.muted }]}>{0} uses · {(0) * 50} credits earned</Text>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.primary }]} onPress={handleShare}><Text style={styles.shareBtnText}>Share Referral Code</Text></TouchableOpacity>
          </View>
        ) : null}
        {history && history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Referral History</Text>
            {history.map((r, i) => (
              <View key={i} style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.historyName, { color: colors.foreground }]}>{r.referredUser?.name || "Anonymous"}</Text>
                <Text style={[styles.historyCredits, { color: colors.success }]}>+50 credits</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  heroCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 10 },
  heroIcon: { fontSize: 48 }, heroTitle: { fontSize: 20, fontWeight: "700" }, heroDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  codeCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 12 },
  codeLabel: { fontSize: 13 }, code: { fontSize: 28, fontWeight: "700", letterSpacing: 4 }, usesText: { fontSize: 12 },
  shareBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }, shareBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  historySection: { gap: 8 }, sectionTitle: { fontSize: 16, fontWeight: "600" },
  historyCard: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", justifyContent: "space-between" },
  historyName: { fontSize: 14 }, historyCredits: { fontSize: 14, fontWeight: "600" },
});
