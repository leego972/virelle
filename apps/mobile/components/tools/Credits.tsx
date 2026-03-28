import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
export default function CreditsScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const { data: creditsData, isLoading } = trpc.credits.balance.useQuery();
  const { data: history } = trpc.credits.history.useQuery();
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Credits</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {isLoading ? <ActivityIndicator color={colors.primary} /> : (
          <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.balanceLabel, { color: colors.muted }]}>Available Credits</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>{creditsData?.isUnlimited ? "∞ Unlimited" : creditsData?.credits ?? 0}</Text>
            <Text style={[styles.tierLabel, { color: colors.muted }]}>{creditsData?.tier?.toUpperCase()} Plan</Text>
            <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/tool/subscription" as never)}><Text style={styles.upgradeBtnText}>Upgrade for More Credits</Text></TouchableOpacity>
          </View>
        )}
        <View style={[styles.costTable, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.costTitle, { color: colors.foreground }]}>Credit Costs</Text>
          {[["Director Chat", "1 credit/message"], ["Script Writer", "10 credits"], ["Storyboard Panel", "5 credits"], ["Shot List", "5 credits"], ["Video Generation", "5 credits/second"], ["Trailer", "50 credits"], ["Dialogue Enhancer", "3 credits"], ["Budget Estimator", "5 credits"], ["Continuity Check", "5 credits"], ["Subtitle Generator", "5 credits"]].map(([tool, cost]) => (
            <View key={tool} style={[styles.costRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.costTool, { color: colors.foreground }]}>{tool}</Text>
              <Text style={[styles.costAmount, { color: colors.muted }]}>{cost}</Text>
            </View>
          ))}
        </View>
        {history && history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transaction History</Text>
            {history.map(tx => (
              <View key={tx.id} style={[styles.txCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.txInfo}><Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text><Text style={[styles.txDate, { color: colors.muted }]}>{new Date(tx.createdAt).toLocaleDateString()}</Text></View>
                <Text style={[styles.txAmount, { color: tx.amount > 0 ? colors.success : colors.error }]}>{tx.amount > 0 ? "+" : ""}{tx.amount}</Text>
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
  balanceCard: { borderRadius: 16, borderWidth: 2, padding: 24, alignItems: "center", gap: 8 },
  balanceLabel: { fontSize: 13 }, balanceValue: { fontSize: 40, fontWeight: "700" }, tierLabel: { fontSize: 12 },
  upgradeBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 4 }, upgradeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  costTable: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 0 }, costTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  costRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 0.5 },
  costTool: { fontSize: 13 }, costAmount: { fontSize: 13 },
  historySection: { gap: 8 }, sectionTitle: { fontSize: 16, fontWeight: "600" },
  txCard: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txInfo: { flex: 1 }, txDesc: { fontSize: 14 }, txDate: { fontSize: 12, marginTop: 2 }, txAmount: { fontSize: 15, fontWeight: "700" },
});
