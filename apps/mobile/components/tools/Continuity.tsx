import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
export default function ContinuityScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const existing = null;
  const checkMutation = trpc.continuity.check.useMutation({
    onError: (err) => Alert.alert("Error", err.message),
  });
  const issues: Array<{severity: string; type: string; description: string; suggestion: string}> = (checkMutation.data as any)?.issues || [];
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Continuity Checker</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.infoIcon}>🔍</Text>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>Script Continuity Analysis</Text>
          <Text style={[styles.infoDesc, { color: colors.muted }]}>AI will analyze your script for plot holes, character inconsistencies, timeline errors, and other continuity issues.</Text>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, (!projectId || checkMutation.isPending) && { opacity: 0.7 }]} onPress={() => { if (!projectId) { Alert.alert("Required", "Select a project first."); return; } checkMutation.mutate({ projectId }); }} disabled={!projectId || checkMutation.isPending}>
          {checkMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Check Continuity (5 credits)</Text>}
        </TouchableOpacity>
        {Array.isArray(issues) && issues.length > 0 && (
          <View style={styles.issuesList}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{issues.length} Issues Found</Text>
            {(issues as Array<{severity: string; type: string; description: string; suggestion: string}>).map((issue, i) => (
              <View key={i} style={[styles.issueCard, { backgroundColor: colors.surface, borderColor: issue.severity === "high" ? colors.error : issue.severity === "medium" ? colors.warning : colors.border }]}>
                <View style={styles.issueHeader}>
                  <Text style={[styles.issueSeverity, { color: issue.severity === "high" ? colors.error : issue.severity === "medium" ? colors.warning : colors.muted }]}>{issue.severity?.toUpperCase()}</Text>
                  <Text style={[styles.issueType, { color: colors.foreground }]}>{issue.type}</Text>
                </View>
                <Text style={[styles.issueDesc, { color: colors.foreground }]}>{issue.description}</Text>
                {issue.suggestion && <Text style={[styles.issueSuggestion, { color: colors.muted }]}>💡 {issue.suggestion}</Text>}
              </View>
            ))}
          </View>
        )}
        {checkMutation.isSuccess && Array.isArray(issues) && issues.length === 0 && (
          <View style={[styles.successCard, { backgroundColor: colors.success + "20", borderColor: colors.success }]}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={[styles.successText, { color: colors.success }]}>No continuity issues found!</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  infoIcon: { fontSize: 40 }, infoTitle: { fontSize: 18, fontWeight: "700" }, infoDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" }, btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  issuesList: { gap: 10 }, sectionTitle: { fontSize: 16, fontWeight: "600" },
  issueCard: { borderRadius: 12, borderWidth: 1.5, padding: 14, gap: 6 },
  issueHeader: { flexDirection: "row", gap: 8, alignItems: "center" },
  issueSeverity: { fontSize: 11, fontWeight: "700" }, issueType: { fontSize: 14, fontWeight: "600" },
  issueDesc: { fontSize: 13, lineHeight: 20 }, issueSuggestion: { fontSize: 12, lineHeight: 18 },
  successCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  successIcon: { fontSize: 32 }, successText: { fontSize: 16, fontWeight: "600" },
});
