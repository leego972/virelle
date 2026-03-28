import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function TrailerScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [style, setStyle] = useState("Dramatic");
  const STYLES = ["Dramatic", "Action", "Horror", "Comedy", "Romance", "Epic", "Mystery"];
  const generateMutation = trpc.trailer.generate.useMutation({
    onSuccess: () => Alert.alert("Success", "Trailer generation started! Check the Movies tab."),
    onError: (err) => Alert.alert("Error", err.message),
  });
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Trailer Generator</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.infoIcon}>🎞️</Text>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>AI Trailer Generator</Text>
          <Text style={[styles.infoDesc, { color: colors.muted }]}>Generate a cinematic 90-second trailer for your film project using AI. The trailer will be assembled from your project's scenes and script.</Text>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Trailer Style</Text>
          <View style={styles.chipGrid}>
            {STYLES.map(s => (
              <TouchableOpacity key={s} style={[styles.chip, { borderColor: colors.border }, style === s && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setStyle(s)}>
                <Text style={[styles.chipText, { color: style === s ? "#fff" : colors.foreground }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.costBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.costText, { color: colors.muted }]}>💳 Cost: 50 credits</Text>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, (!projectId || generateMutation.isPending) && { opacity: 0.7 }]} onPress={() => { if (!projectId) { Alert.alert("Required", "Select a project first."); return; } generateMutation.mutate({ projectId, style }); }} disabled={!projectId || generateMutation.isPending}>
          {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Trailer</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  infoIcon: { fontSize: 40 }, infoTitle: { fontSize: 18, fontWeight: "700" }, infoDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  costBox: { borderRadius: 10, borderWidth: 1, padding: 12 }, costText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
