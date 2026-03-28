import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
export default function CharactersScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("Protagonist");
  const [description, setDescription] = useState("");
  const { data: characters, refetch } = trpc.characters.list.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const createMutation = trpc.characters.create.useMutation({ onSuccess: () => { refetch(); setName(""); setDescription(""); }, onError: (err) => Alert.alert("Error", err.message) });
  const ROLES = ["Protagonist", "Antagonist", "Supporting", "Minor", "Narrator"];
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Characters</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {characters && characters.length > 0 && (
          <View style={styles.charList}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cast ({characters.length})</Text>
            {characters.map(c => (
              <View key={c.id} style={[styles.charCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.charAvatar, { backgroundColor: colors.primary }]}><Text style={styles.charAvatarText}>{c.name.charAt(0)}</Text></View>
                <View style={styles.charInfo}>
                  <Text style={[styles.charName, { color: colors.foreground }]}>{c.name}</Text>
                  <Text style={[styles.charRole, { color: colors.muted }]}>{c.role}</Text>
                  {c.description && <Text style={[styles.charDesc, { color: colors.muted }]} numberOfLines={2}>{c.description}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Add Character</Text>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Name</Text><TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="Detective Sarah Chen" placeholderTextColor={colors.muted} value={name} onChangeText={setName} /></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Role</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chipRow}>{ROLES.map(r => (<TouchableOpacity key={r} style={[styles.chip, { borderColor: colors.border }, role === r && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setRole(r)}><Text style={[styles.chipText, { color: role === r ? "#fff" : colors.foreground }]}>{r}</Text></TouchableOpacity>))}</View></ScrollView></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Description</Text><TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="A seasoned detective haunted by a cold case..." placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} multiline numberOfLines={3} /></View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, createMutation.isPending && { opacity: 0.7 }]} onPress={() => { if (!name.trim() || !projectId) { Alert.alert("Required", "Enter a name and select a project."); return; } createMutation.mutate({ projectId, name, role, description }); }} disabled={createMutation.isPending}>
          {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Add Character</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  charList: { gap: 8 }, sectionTitle: { fontSize: 16, fontWeight: "600" },
  charCard: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  charAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  charAvatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  charInfo: { flex: 1 }, charName: { fontSize: 15, fontWeight: "600" }, charRole: { fontSize: 12, marginTop: 2 }, charDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 }, chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" }, btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
