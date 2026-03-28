import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
export default function DialogueScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [dialogue, setDialogue] = useState("");
  const [character, setCharacter] = useState("");
  const [tone, setTone] = useState("Dramatic");
  const [enhanced, setEnhanced] = useState("");
  const TONES = ["Dramatic", "Comedic", "Tense", "Romantic", "Mysterious", "Angry", "Sad"];
  const enhanceMutation = trpc.dialogue.enhance.useMutation({
    onSuccess: (data) => setEnhanced(data.enhanced),
    onError: (err) => Alert.alert("Error", err.message),
  });
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Dialogue Enhancer</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Character Name</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="Detective Sarah..." placeholderTextColor={colors.muted} value={character} onChangeText={setCharacter} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Original Dialogue</Text>
          <TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="I need to find the truth..." placeholderTextColor={colors.muted} value={dialogue} onChangeText={setDialogue} multiline numberOfLines={4} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Tone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chipRow}>{TONES.map(t => (<TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, tone === t && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setTone(t)}><Text style={[styles.chipText, { color: tone === t ? "#fff" : colors.foreground }]}>{t}</Text></TouchableOpacity>))}</View></ScrollView>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, enhanceMutation.isPending && { opacity: 0.7 }]} onPress={() => { if (!dialogue.trim()) { Alert.alert("Required", "Enter dialogue to enhance."); return; } enhanceMutation.mutate({ dialogue, character, tone }); }} disabled={enhanceMutation.isPending}>
          {enhanceMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enhance Dialogue (3 credits)</Text>}
        </TouchableOpacity>
        {enhanced ? (<View style={styles.resultSection}><Text style={[styles.resultLabel, { color: colors.foreground }]}>Enhanced Dialogue</Text><View style={[styles.resultBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.resultText, { color: colors.foreground }]}>{enhanced}</Text></View></View>) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 }, chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" }, btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resultSection: { gap: 8 }, resultLabel: { fontSize: 16, fontWeight: "600" },
  resultBox: { borderRadius: 12, borderWidth: 1, padding: 14 }, resultText: { fontSize: 14, lineHeight: 22 },
});
