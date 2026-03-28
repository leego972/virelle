import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Modal, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type FundingSource = {
  id: number;
  country: string;
  organization: string;
  type?: string | null;
  supports?: string | null;
  stage?: string | null;
  fundingForm?: string | null;
  eligibility?: string | null;
  officialSite?: string | null;
  notes?: string | null;
  packType?: string | null;
  primaryLanguage?: string | null;
  packTitle?: string | null;
  tailoringNotes?: string | null;
};

const DISCLAIMER =
  "Professional Working Pack. This directory is structured around recurring requirements published by representative official bodies — BFI, Telefilm Canada, Screen Australia, IDFA Bertha Fund, and Doha Film Institute. For final submission, verify exact requirements against the target fund's live page. Legal declarations and upload wording should be checked before submitting.";

export default function FundingDirectoryScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedSource, setSelectedSource] = useState<FundingSource | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const sourcesQuery = trpc.funding.list.useQuery({} as any);
  const sources: FundingSource[] = (sourcesQuery.data as any) || [];

  const createApp = trpc.funding.create.useMutation({
    onSuccess: () => {
      Alert.alert(
        "Draft Created",
        "Your application draft has been saved. Open the full Virelle Studios web app to complete all 13 sections and submit.",
      );
      setShowApplyModal(false);
      setProjectTitle("");
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  const countries = useMemo(() => {
    const all = [...new Set(sources.map((s) => s.country))].sort();
    return ["All", ...all];
  }, [sources]);

  const filtered = useMemo(() => {
    return sources.filter((s) => {
      const matchCountry = selectedCountry === "All" || s.country === selectedCountry;
      const matchSearch =
        !search ||
        s.organization.toLowerCase().includes(search.toLowerCase()) ||
        s.country.toLowerCase().includes(search.toLowerCase()) ||
        (s.type || "").toLowerCase().includes(search.toLowerCase());
      return matchCountry && matchSearch;
    });
  }, [sources, selectedCountry, search]);

  const grouped = useMemo(() => {
    return filtered.reduce(
      (acc, s) => {
        if (!acc[s.country]) acc[s.country] = [];
        acc[s.country].push(s);
        return acc;
      },
      {} as Record<string, FundingSource[]>,
    );
  }, [filtered]);

  function getTypeColor(type?: string | null) {
    if (!type) return colors.muted;
    const t = type.toLowerCase();
    if (t.includes("grant")) return "#22C55E";
    if (t.includes("co-prod")) return "#3B82F6";
    if (t.includes("tax")) return "#F59E0B";
    if (t.includes("loan")) return "#8B5CF6";
    return colors.primary;
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Funding Directory</Text>
        <Text style={[styles.count, { color: colors.muted }]}>
          {sourcesQuery.isLoading ? "…" : `${filtered.length}`}
        </Text>
      </View>

      {/* Disclaimer banner */}
      {showDisclaimer && (
        <View style={[styles.disclaimer, { backgroundColor: "#1e3a5f", borderColor: "#2563EB" }]}>
          <Text style={[styles.disclaimerText, { color: "#93C5FD" }]} numberOfLines={3}>
            ℹ️ {DISCLAIMER}
          </Text>
          <TouchableOpacity onPress={() => setShowDisclaimer(false)}>
            <Text style={{ color: "#93C5FD", fontSize: 18, paddingLeft: 8 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.muted }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search funders…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Country filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "center" }}
      >
        {countries.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.chip,
              { borderColor: colors.border },
              selectedCountry === c && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setSelectedCountry(c)}
          >
            <Text style={[styles.chipText, { color: selectedCountry === c ? "#fff" : colors.foreground }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Funder list */}
      {sourcesQuery.isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading 94 funders…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {Object.entries(grouped).map(([country, funders]) => (
            <View key={country} style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <Text style={[styles.countryTitle, { color: colors.muted }]}>
                {country.toUpperCase()} · {funders.length}
              </Text>
              {funders.map((funder) => (
                <TouchableOpacity
                  key={funder.id}
                  style={[styles.funderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setSelectedSource(funder)}
                  activeOpacity={0.7}
                >
                  <View style={styles.funderHeader}>
                    <Text style={[styles.funderOrg, { color: colors.foreground }]} numberOfLines={2}>
                      {funder.organization}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 20 }}>›</Text>
                  </View>
                  <View style={styles.funderMeta}>
                    {funder.type && (
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(funder.type) + "22" }]}>
                        <Text style={[styles.typeText, { color: getTypeColor(funder.type) }]}>{funder.type}</Text>
                      </View>
                    )}
                    {funder.stage && (
                      <View style={[styles.typeBadge, { backgroundColor: colors.border }]}>
                        <Text style={[styles.typeText, { color: colors.muted }]}>{funder.stage}</Text>
                      </View>
                    )}
                    {funder.primaryLanguage && funder.primaryLanguage !== "English" && (
                      <View style={[styles.typeBadge, { backgroundColor: colors.primary + "22" }]}>
                        <Text style={[styles.typeText, { color: colors.primary }]}>{funder.primaryLanguage}</Text>
                      </View>
                    )}
                  </View>
                  {funder.supports && (
                    <Text style={[styles.funderSupports, { color: colors.muted }]} numberOfLines={1}>
                      {funder.supports}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={styles.emptyCenter}>
              <Text style={{ fontSize: 40 }}>🌍</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No funders found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                Try a different search or country filter.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Funder Detail Modal ── */}
      <Modal
        visible={!!selectedSource}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSource(null)}
      >
        {selectedSource && (
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelectedSource(null)}>
                <Text style={{ color: colors.primary, fontSize: 16 }}>‹ Back</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
                {selectedSource.organization}
              </Text>
              <View style={{ width: 48 }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }}>
              {/* Country & type badges */}
              <View style={styles.detailMeta}>
                <View style={[styles.typeBadge, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.typeText, { color: colors.primary }]}>🌍 {selectedSource.country}</Text>
                </View>
                {selectedSource.type && (
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(selectedSource.type) + "22" }]}>
                    <Text style={[styles.typeText, { color: getTypeColor(selectedSource.type) }]}>
                      {selectedSource.type}
                    </Text>
                  </View>
                )}
                {selectedSource.stage && (
                  <View style={[styles.typeBadge, { backgroundColor: colors.border }]}>
                    <Text style={[styles.typeText, { color: colors.muted }]}>{selectedSource.stage}</Text>
                  </View>
                )}
              </View>

              {selectedSource.packTitle && (
                <View style={[styles.detailSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>APPLICATION PACK</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedSource.packTitle}</Text>
                </View>
              )}

              {selectedSource.supports && (
                <View style={[styles.detailSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>SUPPORTS</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedSource.supports}</Text>
                </View>
              )}

              {selectedSource.eligibility && (
                <View style={[styles.detailSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>ELIGIBILITY</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedSource.eligibility}</Text>
                </View>
              )}

              {selectedSource.fundingForm && (
                <View style={[styles.detailSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>FUNDING FORM</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedSource.fundingForm}</Text>
                </View>
              )}

              {selectedSource.tailoringNotes && (
                <View style={[styles.detailSection, { backgroundColor: "#1e3a5f", borderColor: "#2563EB" }]}>
                  <Text style={[styles.detailLabel, { color: "#93C5FD" }]}>TAILORING NOTES</Text>
                  <Text style={[styles.detailValue, { color: "#BFDBFE" }]}>{selectedSource.tailoringNotes}</Text>
                </View>
              )}

              {selectedSource.notes && (
                <View style={[styles.detailSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>NOTES</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{selectedSource.notes}</Text>
                </View>
              )}

              {/* Disclaimer */}
              <View style={[styles.detailSection, { backgroundColor: "#1e3a5f", borderColor: "#2563EB" }]}>
                <Text style={[styles.detailLabel, { color: "#93C5FD" }]}>⚠️ IMPORTANT</Text>
                <Text style={[styles.detailValue, { color: "#BFDBFE", fontSize: 12 }]}>{DISCLAIMER}</Text>
              </View>

              {selectedSource.officialSite && (
                <TouchableOpacity
                  style={[styles.linkBtn, { borderColor: colors.primary }]}
                  onPress={() => Linking.openURL(selectedSource.officialSite!)}
                >
                  <Text style={[styles.linkBtnText, { color: colors.primary }]}>🌐 Visit Official Site</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowApplyModal(true)}
              >
                <Text style={styles.applyBtnText}>Start Application Draft</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* ── Start Application Modal ── */}
      <Modal
        visible={showApplyModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowApplyModal(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Start Application</Text>
            <TouchableOpacity
              onPress={() => {
                if (!selectedSource) return;
                if (!projectTitle.trim()) {
                  Alert.alert("Required", "Please enter your project title.");
                  return;
                }
                createApp.mutate({
                  projectId: projectId,
                  fundingOrganization: selectedSource.organization,
                  projectTitle: projectTitle.trim(),
                  formData: { country: selectedSource.country, type: selectedSource.type },
                });
              }}
            >
              {createApp.isPending ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
            <View style={[styles.detailSection, { backgroundColor: "#1e3a5f", borderColor: "#2563EB" }]}>
              <Text style={[styles.detailLabel, { color: "#93C5FD" }]}>FUNDER</Text>
              <Text style={[styles.detailValue, { color: "#BFDBFE" }]}>{selectedSource?.organization}</Text>
              <Text style={{ color: "#93C5FD", fontSize: 12, marginTop: 4 }}>{selectedSource?.country}</Text>
            </View>
            <View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Project Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
                ]}
                value={projectTitle}
                onChangeText={setProjectTitle}
                placeholder="Your film's title"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
            </View>
            <View style={[styles.detailSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>NEXT STEPS</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                This creates a draft in your account. Open the full Virelle Studios web app to complete all 13 sections,
                attach supporting documents, and submit.
              </Text>
            </View>
            <View style={[styles.detailSection, { backgroundColor: "#1e3a5f", borderColor: "#2563EB" }]}>
              <Text style={[styles.detailLabel, { color: "#93C5FD" }]}>⚠️ REMINDER</Text>
              <Text style={{ color: "#BFDBFE", fontSize: 12 }}>
                Always verify exact requirements against the fund's live page before submitting. Legal declarations and
                upload wording should be checked carefully.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  back: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: "600" },
  count: { fontSize: 14 },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  countryTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  funderCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, gap: 6 },
  funderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  funderOrg: { fontSize: 15, fontWeight: "600", flex: 1 },
  funderMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  funderSupports: { fontSize: 12, lineHeight: 16 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 11, fontWeight: "600" },
  emptyCenter: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  modalTitle: { fontSize: 17, fontWeight: "600", flex: 1, textAlign: "center" },
  detailMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  detailSection: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  detailLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  detailValue: { fontSize: 14, lineHeight: 20 },
  linkBtn: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, alignItems: "center" },
  linkBtnText: { fontSize: 15, fontWeight: "600" },
  applyBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  applyBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
});
