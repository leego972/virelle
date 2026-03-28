import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
export default function SubtitlesScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const existing = null;
  const generateMutation = trpc.subtitles.generate.useMutation({
    onError: (err) => Alert.alert("Error", err.message),
  });
  const subtitles = generateMutation.data?.srt || "";
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Subtitle Generator</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.infoIcon}>📺</Text>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>Auto Subtitle Generation</Text>
          <Text style={[styles.infoDesc, { color: colors.muted }]}>Generate SRT-format subtitles from your script. Includes timing, speaker labels, and proper formatting.</Text>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, (!projectId || generateMutation.isPending) && { opacity: 0.7 }]} onPress={() => { if (!projectId) { Alert.alert("Required", "Select a project first."); return; } generateMutation.mutate({ projectId, scriptContent: "Generate subtitles for this project" }); }} disabled={!projectId || generateMutation.isPending}>
          {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Subtitles (5 credits)</Text>}
        </TouchableOpacity>
        {subtitles ? (
          <View style={styles.subtitleSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Generated Subtitles (SRT)</Text>
            <View style={[styles.srtBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.srtText, { color: colors.foreground }]}>{String(subtitles)}</Text>
            </View>
          </View>
        ) : null}
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
  subtitleSection: { gap: 8 }, sectionTitle: { fontSize: 16, fontWeight: "600" },
  srtBox: { borderRadius: 12, borderWidth: 1, padding: 14 }, srtText: { fontSize: 12, fontFamily: "monospace", lineHeight: 20 },
});
