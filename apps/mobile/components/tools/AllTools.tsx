/**
 * All Tools Screen — Live Feature Registry
 * Fetches tools from the Virelle Studios server. New features auto-appear here.
 * Native tools open natively; others open in an authenticated WebView.
 */
import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useFeatureRegistry, FeatureEntry } from "@/hooks/use-feature-registry";

const TIER_COLORS: Record<string, string> = { free: "#6B7280", amateur: "#3B82F6", independent: "#8B5CF6", creator: "#F59E0B", studio: "#EF4444", industry: "#EC4899" };
const TIER_LABELS: Record<string, string> = { free: "Free", amateur: "Amateur", independent: "Independent", creator: "Creator", studio: "Studio", industry: "Industry" };
const CATEGORIES = ["All", "Writing", "Visual", "AI Video", "Production", "Post-Production", "Management", "Account"];

export default function AllToolsScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const { registry, loading } = useFeatureRegistry();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered = useMemo(() => registry.features.filter(f => {
    if (f.isAdmin) return false;
    const matchSearch = !search || f.label.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "All" || f.category === selectedCategory;
    return matchSearch && matchCat;
  }), [registry.features, search, selectedCategory]);

  const grouped = useMemo(() => {
    if (selectedCategory !== "All") return { [selectedCategory]: filtered };
    return filtered.reduce((acc, f) => { if (!acc[f.category]) acc[f.category] = []; acc[f.category].push(f); return acc; }, {} as Record<string, FeatureEntry[]>);
  }, [filtered, selectedCategory]);

  function openTool(feature: FeatureEntry) {
    if (feature.hasNative) {
      router.push({ pathname: "/tool/[name]", params: { name: feature.id, projectId: String(projectId ?? "") } });
    } else {
      router.push({ pathname: "/tool/webview" as never, params: { label: feature.label, webPath: feature.webPath, projectId: String(projectId ?? "") } });
    }
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>All Tools</Text>
        <Text style={[styles.count, { color: colors.muted }]}>{loading ? "…" : `${filtered.length}`}</Text>
      </View>
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.muted }}>🔍</Text>
        <TextInput style={[styles.searchInput, { color: colors.foreground }]} placeholder="Search tools…" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} returnKeyType="search" />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch("")}><Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text></TouchableOpacity>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} style={[styles.catChip, { borderColor: colors.border }, selectedCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setSelectedCategory(cat)}>
            <Text style={[styles.catText, { color: selectedCategory === cat ? "#fff" : colors.foreground }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {Object.entries(grouped).map(([category, features]) => (
          <View key={category} style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={[styles.catTitle, { color: colors.muted }]}>{category.toUpperCase()}</Text>
            {features.map(feature => (
              <TouchableOpacity key={feature.id} style={[styles.toolRow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openTool(feature)} activeOpacity={0.7}>
                <Text style={styles.toolIcon}>{feature.icon}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={[styles.toolLabel, { color: colors.foreground }]}>{feature.label}</Text>
                    {feature.isNew && <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={styles.badgeText}>NEW</Text></View>}
                    {!feature.hasNative && <View style={[styles.badge, { backgroundColor: colors.border }]}><Text style={[styles.badgeText, { color: colors.muted }]}>WEB</Text></View>}
                  </View>
                  <Text style={[styles.toolDesc, { color: colors.muted }]} numberOfLines={1}>{feature.description}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {feature.minTier !== "free" && (
                    <View style={[styles.tierBadge, { backgroundColor: (TIER_COLORS[feature.minTier] ?? "#6B7280") + "20" }]}>
                      <Text style={[styles.tierText, { color: TIER_COLORS[feature.minTier] ?? "#6B7280" }]}>{TIER_LABELS[feature.minTier]}</Text>
                    </View>
                  )}
                  <Text style={{ color: colors.muted, fontSize: 20 }}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {filtered.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 8 }}>
            <Text style={{ fontSize: 40 }}>🔧</Text>
            <Text style={[styles.toolLabel, { color: colors.foreground }]}>No tools found</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>Try a different search or category.</Text>
          </View>
        )}
        <Text style={[styles.registryNote, { color: colors.muted }]}>
          {loading ? "Checking for new tools…" : `${registry.features.filter(f => !f.isAdmin).length} tools · synced from virellestudios.com`}
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" }, count: { fontSize: 14 },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginVertical: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 }, catText: { fontSize: 13, fontWeight: "500" },
  catTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  toolRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  toolIcon: { fontSize: 28, width: 36, textAlign: "center" },
  toolLabel: { fontSize: 15, fontWeight: "600" }, toolDesc: { fontSize: 12, lineHeight: 16 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }, badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }, tierText: { fontSize: 10, fontWeight: "700" },
  registryNote: { fontSize: 11, textAlign: "center", paddingVertical: 16 },
});
