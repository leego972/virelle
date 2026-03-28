import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
export default function FilmGeneratorScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [premise, setPremise] = useState("");
  const [genre, setGenre] = useState("Drama");
  const [duration, setDuration] = useState(30);
  const GENRES = ["Drama", "Thriller", "Comedy", "Horror", "Sci-Fi", "Romance", "Action"];
  const DURATIONS = [15, 30, 60, 90];
  const generateMutation = trpc.videos.generate.useMutation({
    onSuccess: () => Alert.alert("Success", "Full film generation started! This may take several minutes. Check the Movies tab."),
    onError: (err) => Alert.alert("Error", err.message),
  });
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Full Film Generator</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.infoIcon}>🎦</Text>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>AI Full Film Generator</Text>
          <Text style={[styles.infoDesc, { color: colors.muted }]}>Generate a complete short film from just a premise. AI will write the script, create storyboards, and produce the video automatically.</Text>
        </View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Film Premise</Text><TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="A lonely lighthouse keeper discovers a mysterious signal from the deep sea..." placeholderTextColor={colors.muted} value={premise} onChangeText={setPremise} multiline numberOfLines={4} /></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Genre</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chipRow}>{GENRES.map(g => (<TouchableOpacity key={g} style={[styles.chip, { borderColor: colors.border }, genre === g && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setGenre(g)}><Text style={[styles.chipText, { color: genre === g ? "#fff" : colors.foreground }]}>{g}</Text></TouchableOpacity>))}</View></ScrollView></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Duration (seconds)</Text><View style={styles.chipRow}>{DURATIONS.map(d => (<TouchableOpacity key={d} style={[styles.chip, { borderColor: colors.border }, duration === d && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setDuration(d)}><Text style={[styles.chipText, { color: duration === d ? "#fff" : colors.foreground }]}>{d}s</Text></TouchableOpacity>))}</View></View>
        <View style={[styles.costBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.costText, { color: colors.muted }]}>💳 Cost: {duration * 5 + 20} credits (video + script + storyboard)</Text></View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, generateMutation.isPending && { opacity: 0.7 }]} onPress={() => { if (!premise.trim()) { Alert.alert("Required", "Enter a film premise."); return; } generateMutation.mutate({ prompt: `${genre} film: ${premise}`, duration, projectId, type: "film" }); }} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Full Film</Text>}
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
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 }, chipText: { fontSize: 13 },
  costBox: { borderRadius: 10, borderWidth: 1, padding: 12 }, costText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" }, btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
