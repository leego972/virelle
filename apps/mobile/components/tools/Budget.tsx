import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
type LineItem = { category: string; item: string; cost: number; notes: string };
export default function BudgetScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [sceneCount, setSceneCount] = useState("");
  const [budget, setBudget] = useState<{ totalBudget: number; lineItems: LineItem[] } | null>(null);
  const { data: existing } = trpc.budget.get.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const generateMutation = trpc.budget.generate.useMutation({
    onSuccess: (data) => setBudget(data as { totalBudget: number; lineItems: LineItem[] }),
    onError: (err) => Alert.alert("Error", err.message),
  });
  const displayBudget = budget || (existing ? { totalBudget: Number(existing.totalBudget), lineItems: existing.lineItems as LineItem[] } : null);
  const categories = displayBudget ? [...new Set(displayBudget.lineItems.map(i => i.category))] : [];
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Budget Estimator</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Project Description</Text>
          <TextInput style={[styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="A psychological thriller set in modern-day New York..." placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>Number of Scenes (optional)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} placeholder="e.g. 20" placeholderTextColor={colors.muted} value={sceneCount} onChangeText={setSceneCount} keyboardType="number-pad" />
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }, generateMutation.isPending && { opacity: 0.7 }]} onPress={() => { if (!description.trim() || !projectId) { Alert.alert("Required", "Enter a description and select a project."); return; } generateMutation.mutate({ projectId, projectDescription: description, sceneCount: sceneCount ? Number(sceneCount) : undefined }); }} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Generate Budget (5 credits)</Text>}
        </TouchableOpacity>
        {displayBudget && (
          <View style={styles.budgetContainer}>
            <View style={[styles.totalCard, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
              <Text style={[styles.totalLabel, { color: colors.muted }]}>Total Budget</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>${displayBudget.totalBudget.toLocaleString()}</Text>
            </View>
            {categories.map(cat => (
              <View key={cat} style={styles.categorySection}>
                <Text style={[styles.catTitle, { color: colors.foreground }]}>{cat}</Text>
                {displayBudget.lineItems.filter(i => i.category === cat).map((item, idx) => (
                  <View key={idx} style={[styles.lineItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.lineItemLeft}><Text style={[styles.lineItemName, { color: colors.foreground }]}>{item.item}</Text>{item.notes ? <Text style={[styles.lineItemNotes, { color: colors.muted }]}>{item.notes}</Text> : null}</View>
                    <Text style={[styles.lineItemCost, { color: colors.foreground }]}>${item.cost.toLocaleString()}</Text>
                  </View>
                ))}
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
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, fontSize: 15 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" }, btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  budgetContainer: { gap: 16 },
  totalCard: { borderRadius: 14, borderWidth: 2, padding: 20, alignItems: "center", gap: 4 },
  totalLabel: { fontSize: 13 }, totalAmount: { fontSize: 32, fontWeight: "700" },
  categorySection: { gap: 8 }, catTitle: { fontSize: 15, fontWeight: "700" },
  lineItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 0.5 },
  lineItemLeft: { flex: 1 }, lineItemName: { fontSize: 14 }, lineItemNotes: { fontSize: 12, marginTop: 2 },
  lineItemCost: { fontSize: 14, fontWeight: "600" },
});
