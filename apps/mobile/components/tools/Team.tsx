import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
export default function TeamScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const { data: members, refetch } = trpc.team.list.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const inviteMutation = trpc.team.invite.useMutation({ onSuccess: () => { refetch(); setEmail(""); Alert.alert("Invited", "Team member invited successfully!"); }, onError: (err) => Alert.alert("Error", err.message) });
  const ROLES = ["viewer", "editor", "admin"];
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Team</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {members && members.length > 0 && (
          <View style={styles.membersList}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Team Members ({members.length})</Text>
            {members.map(m => (
              <View key={m.id} style={[styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{(String(m.userId)).charAt(0).toUpperCase()}</Text></View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.foreground }]}>{String(m.userId)}</Text>
                  <Text style={[styles.memberRole, { color: colors.muted }]}>{m.role}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Invite Member</Text>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Email Address</Text><TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="collaborator@example.com" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></View>
        <View style={styles.fieldGroup}><Text style={[styles.label, { color: colors.muted }]}>Role</Text><View style={styles.chipRow}>{ROLES.map(r => (<TouchableOpacity key={r} style={[styles.chip, { borderColor: colors.border }, role === r && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setRole(r)}><Text style={[styles.chipText, { color: role === r ? "#fff" : colors.foreground }]}>{r}</Text></TouchableOpacity>))}</View></View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, inviteMutation.isPending && { opacity: 0.7 }]} onPress={() => { if (!email.trim() || !projectId) { Alert.alert("Required", "Enter an email and select a project."); return; } inviteMutation.mutate({ projectId, email, role: role as "director" | "writer" | "editor" | "viewer" }); }} disabled={inviteMutation.isPending}>
          {inviteMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Invitation</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  membersList: { gap: 8 }, sectionTitle: { fontSize: 16, fontWeight: "600" },
  memberCard: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  memberInfo: { flex: 1 }, memberName: { fontSize: 14, fontWeight: "600" }, memberRole: { fontSize: 12, marginTop: 2 },
  fieldGroup: { gap: 8 }, label: { fontSize: 13, fontWeight: "500" },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  chipRow: { flexDirection: "row", gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 }, chipText: { fontSize: 13 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" }, btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
