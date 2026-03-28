import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, FlatList } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
export default function SceneBuilderScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("Day");
  const { data: scenes, refetch } = trpc.scenes.list.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const createMutation = trpc.scenes.create.useMutation({ onSuccess: () => { refetch(); setTitle(""); setDescription(""); setLocation(""); }, onError: (err) => Alert.alert("Error", err.message) });
  const TIMES = ["Day", "Night", "Dawn", "Dusk", "Interior", "Exterior"];
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Scene Builder</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {scenes && scenes.length > 0 && (
          <View style={styles.scenesList}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scenes ({scenes.length})</Text>
            {scenes.map((s, i) => (
              <View key={s.id} style={[styles.sceneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sceneNum, { color: colors.primary }]}>Scene {s.sceneNumber}</Text>
                <Text style={[styles.sceneTitle, { color: colors.foreground }]}>{s.title}</Text>
                {s.location && <Text style={[styles.sceneMeta, { color: colors.muted }]}>{s.location} · {s.timeOfDay}</Text>}
              </View>
            ))}
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Add New Scene</Text>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Scene Title</Text><TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="The Confrontation" placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} /></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Location</Text><TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="Police precinct, interrogation room" placeholderTextColor={colors.muted} value={location} onChangeText={setLocation} /></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Time of Day</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chipRow}>{TIMES.map(t => (<TouchableOpacity key={t} style={[styles.chip, { borderColor: colors.border }, timeOfDay === t && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setTimeOfDay(t)}><Text style={[styles.chipText, { color: timeOfDay === t ? "#fff" : colors.foreground }]}>{t}</Text></TouchableOpacity>))}</View></ScrollView></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Description</Text><TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="What happens in this scene..." placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} multiline numberOfLines={3} /></View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, createMutation.isPending && { opacity: 0.7 }]} onPress={() => { if (!title.trim() || !projectId) { Alert.alert("Required", "Enter a scene title and select a project."); return; } createMutation.mutate({ projectId, title, description, location, timeOfDay, sceneNumber: (scenes?.length ?? 0) + 1 }); }} disabled={createMutation.isPending}>
          {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Add Scene</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  scenesList: { gap: 8 }, sectionTitle: { fontSize: 16, fontWeight: "600" },
  sceneCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  sceneNum: { fontSize: 11, fontWeight: "700" }, sceneTitle: { fontSize: 14, fontWeight: "600" }, sceneMeta: { fontSize: 12 },
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 }, chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" }, btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
