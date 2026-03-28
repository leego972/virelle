import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, FlatList } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Shot = { shotNumber: number; shotType: string; cameraAngle: string; description: string; duration: number; notes: string };

export default function ShotListScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [sceneDesc, setSceneDesc] = useState("");
  const [genre, setGenre] = useState("Drama");
  const [shots, setShots] = useState<Shot[]>([]);

  const { data: existing } = trpc.shotList.get.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const generateMutation = trpc.shotList.generate.useMutation({
    onSuccess: (data) => setShots(data.shots as Shot[]),
    onError: (err) => Alert.alert("Error", err.message),
  });

  const displayShots = shots.length > 0 ? shots : (existing?.content as Shot[] ?? []);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Shot List</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Scene Description</Text>
          <TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="Describe the scene you need shots for..." placeholderTextColor={colors.muted} value={sceneDesc} onChangeText={setSceneDesc} multiline numberOfLines={3} />
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, generateMutation.isPending && { opacity: 0.7 }]} onPress={() => { if (!sceneDesc.trim() || !projectId) { Alert.alert("Required", "Enter a scene description and select a project."); return; } generateMutation.mutate({ projectId, sceneDescription: sceneDesc, genre }); }} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Shot List (5 credits)</Text>}
        </TouchableOpacity>
        {displayShots.length > 0 && (
          <View style={styles.shotsList}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Shot List ({displayShots.length} shots)</Text>
            {displayShots.map((shot, i) => (
              <View key={i} style={[styles.shotCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.shotHeader}>
                  <View style={[styles.shotNum, { backgroundColor: colors.primary }]}><Text style={styles.shotNumText}>{shot.shotNumber}</Text></View>
                  <View style={styles.shotMeta}>
                    <Text style={[styles.shotType, { color: colors.foreground }]}>{shot.shotType}</Text>
                    <Text style={[styles.shotAngle, { color: colors.muted }]}>{shot.cameraAngle}</Text>
                  </View>
                  {shot.duration ? <Text style={[styles.shotDuration, { color: colors.muted }]}>{shot.duration}s</Text> : null}
                </View>
                <Text style={[styles.shotDesc, { color: colors.foreground }]}>{shot.description}</Text>
                {shot.notes ? <Text style={[styles.shotNotes, { color: colors.muted }]}>Note: {shot.notes}</Text> : null}
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
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  shotsList: { gap: 10 }, sectionTitle: { fontSize: 16, fontWeight: "600" },
  shotCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  shotHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  shotNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  shotNumText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  shotMeta: { flex: 1 }, shotType: { fontSize: 14, fontWeight: "600" }, shotAngle: { fontSize: 12 },
  shotDuration: { fontSize: 12 }, shotDesc: { fontSize: 13, lineHeight: 20 }, shotNotes: { fontSize: 12, fontStyle: "italic" },
});
