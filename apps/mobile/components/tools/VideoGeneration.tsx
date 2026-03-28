import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function VideoGenerationScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(4);
  const [type, setType] = useState<"clip"|"trailer"|"film">("clip");
  const DURATIONS = [4, 8, 16, 30];
  const generateMutation = trpc.videos.generate.useMutation({
    onSuccess: () => Alert.alert("Success", "Video generation started! Check the Movies tab."),
    onError: (err) => Alert.alert("Error", err.message),
  });
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Video Generation</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Video Prompt</Text>
          <TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="A cinematic shot of a detective walking through rain-soaked streets at night..." placeholderTextColor={colors.muted} value={prompt} onChangeText={setPrompt} multiline numberOfLines={4} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Duration (seconds)</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map(d => (
              <TouchableOpacity key={d} style={[styles.chip, { borderColor: colors.border }, duration === d && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setDuration(d)}>
                <Text style={[styles.chipText, { color: duration === d ? "#fff" : colors.foreground }]}>{d}s</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.costBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.costText, { color: colors.muted }]}>💳 Cost: {duration * 5} credits ({duration}s × 5 credits/s)</Text>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, generateMutation.isPending && { opacity: 0.7 }]} onPress={() => { if (!prompt.trim()) { Alert.alert("Required", "Enter a video prompt."); return; } generateMutation.mutate({ prompt, duration, projectId, type }); }} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Video</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  costBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  costText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
