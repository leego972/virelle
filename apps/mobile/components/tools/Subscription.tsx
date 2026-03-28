import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// ─── Market-aligned tier definitions (AUD) ───────────────────────────────────
// Updated 2026. Matches web Pricing.tsx exactly.
// Market context:
//   Runway Standard: ~AUD$120/mo — 625 credits (~125 video seconds)
//   Kling Standard:  ~AUD$104/mo — 3,000 credits
//   Artlist Creator: ~AUD$315/mo — music + video licensing only
//   Virelle = complete end-to-end film studio. Priced as infrastructure.

const SELF_SERVE_TIERS = [
  {
    id: "indie",
    name: "Indie",
    monthlyPrice: 149,
    annualPrice: 1490,
    credits: "500 credits/mo",
    creditNote: "~50 video scenes",
    color: "#10B981",
    badge: "Entry Tier",
    features: [
      "AI Script Writer & Screenplay Tools",
      "Character Creator & DNA Lock",
      "Director's AI Assistant",
      "Location Scout & Mood Board",
      "Shot List Generator",
      "Up to 2 projects",
      "720p export",
      "BYOK support",
    ],
    cta: "Start Creating",
    selfServe: true,
  },
  {
    id: "amateur",
    name: "Creator",
    monthlyPrice: 490,
    annualPrice: 4900,
    credits: "2,000 credits/mo",
    creditNote: "~200 video scenes",
    color: "#F59E0B",
    badge: "Most Popular",
    popular: true,
    features: [
      "Everything in Indie, plus:",
      "Video Generation (Runway, Sora, Kling, Veo)",
      "AI Voice Acting (35 emotions, 3,000+ voices)",
      "AI Film Score (Suno v4)",
      "Character DNA Lock across all scenes",
      "Up to 10 projects, 90 min per film",
      "1080p export",
      "BYOK support",
    ],
    cta: "Start Producing",
    selfServe: true,
  },
  {
    id: "independent",
    name: "Studio",
    monthlyPrice: 1490,
    annualPrice: 14900,
    credits: "6,000 credits/mo",
    creditNote: "~600 video scenes",
    color: "#8B5CF6",
    badge: "Commercial",
    features: [
      "Everything in Creator, plus:",
      "Film Post-Production (ADR, Foley, Score, Mix)",
      "Subtitles in 130+ languages",
      "VFX Suite & Bulk Generation",
      "Ad & Poster Maker",
      "Up to 25 projects, 90 min per film",
      "4K + ProRes export",
      "5 team members",
      "Priority rendering queue",
    ],
    cta: "Scale Production",
    selfServe: true,
  },
];

const ENTERPRISE_TIERS = [
  {
    id: "studio",
    name: "Production",
    priceDisplay: "From A$4,990/mo",
    credits: "15,500 credits/mo",
    creditNote: "~1,550 video scenes",
    color: "#3B82F6",
    badge: "Production",
    features: [
      "Everything in Studio, plus:",
      "Up to 100 projects, 150 min per film",
      "VFX Suite (Advanced Effects)",
      "Multi-Shot Sequencer",
      "NLE / DaVinci Resolve Export",
      "AI Casting Tool",
      "White-Label Exports",
      "25 team members",
      "API Access & Pipeline Integration",
      "Global Funding Directory",
    ],
    cta: "Book a Demo",
    selfServe: false,
  },
  {
    id: "industry",
    name: "Enterprise",
    priceDisplay: "Custom Pricing",
    credits: "Tailored to scope",
    creditNote: "",
    color: "#EF4444",
    badge: "Enterprise",
    features: [
      "Everything in Production, plus:",
      "Unlimited projects, 180 min per film",
      "4K + ProRes export",
      "Live Action Plate Compositing",
      "Custom AI Model Fine-Tuning",
      "Dedicated Account Manager",
      "Unlimited team members",
      "Custom onboarding & workflow design",
      "Bespoke commercial terms",
    ],
    cta: "Contact Sales",
    selfServe: false,
  },
];

const ALL_TIERS = [...SELF_SERVE_TIERS, ...ENTERPRISE_TIERS];

export default function SubscriptionScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const { data: creditsData } = trpc.credits.balance.useQuery();
  const checkoutMutation = trpc.subscription.createCheckout?.useMutation?.({
    onSuccess: (data: any) => {
      if (data?.url) Linking.openURL(data.url);
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const currentTierId = creditsData?.tier ?? "free";

  const handleSelect = (tier: typeof ALL_TIERS[0]) => {
    if (!tier.selfServe) {
      Linking.openURL("https://virellestudios.com/contact");
      return;
    }
    if (checkoutMutation) {
      checkoutMutation.mutate({
        tier: tier.id as any,
        billing,
      });
    }
  };

  const annualSaving = (monthly: number, annual: number) => {
    const saving = Math.round(((monthly * 12 - annual) / (monthly * 12)) * 100);
    return saving > 0 ? `Save ${saving}%` : null;
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Plans</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <Text style={[styles.headline, { color: colors.foreground }]}>
          Your Complete Film Studio
        </Text>
        <Text style={[styles.subheadline, { color: colors.muted }]}>
          One platform replaces Runway, ElevenLabs, Suno, and a full production crew.
        </Text>

        {/* Billing Toggle */}
        <View style={[styles.billingToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.billingOption, billing === "monthly" && { backgroundColor: colors.primary }]}
            onPress={() => setBilling("monthly")}
          >
            <Text style={[styles.billingText, { color: billing === "monthly" ? "#fff" : colors.muted }]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingOption, billing === "annual" && { backgroundColor: colors.primary }]}
            onPress={() => setBilling("annual")}
          >
            <Text style={[styles.billingText, { color: billing === "annual" ? "#fff" : colors.muted }]}>
              Annual
            </Text>
            <View style={styles.savingPill}>
              <Text style={styles.savingText}>Save 17%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Self-Serve Tiers */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>SELF-SERVE PLANS</Text>
        {SELF_SERVE_TIERS.map((tier) => {
          const isCurrent = currentTierId === tier.id;
          const price = billing === "annual" ? tier.annualPrice / 12 : tier.monthlyPrice;
          const saving = annualSaving(tier.monthlyPrice, tier.annualPrice);

          return (
            <View
              key={tier.id}
              style={[
                styles.tierCard,
                { backgroundColor: colors.surface, borderColor: isCurrent ? tier.color : colors.border },
                isCurrent && { borderWidth: 2 },
                tier.popular && { borderColor: tier.color, borderWidth: 1.5 },
              ]}
            >
              {/* Badge */}
              <View style={styles.tierTopRow}>
                <View style={[styles.badge, { backgroundColor: tier.color + "20" }]}>
                  <Text style={[styles.badgeText, { color: tier.color }]}>{tier.badge}</Text>
                </View>
                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: tier.color + "20" }]}>
                    <Text style={[styles.currentText, { color: tier.color }]}>Current Plan</Text>
                  </View>
                )}
              </View>

              {/* Name + Price */}
              <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.tierPrice, { color: colors.foreground }]}>
                  A${Math.round(price)}
                </Text>
                <Text style={[styles.perMonth, { color: colors.muted }]}>/mo</Text>
                {billing === "annual" && saving && (
                  <View style={[styles.annualSaving, { backgroundColor: "#10B98120" }]}>
                    <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700" }}>{saving}</Text>
                  </View>
                )}
              </View>
              {billing === "annual" && (
                <Text style={[styles.annualNote, { color: colors.muted }]}>
                  A${tier.annualPrice.toLocaleString()} billed annually
                </Text>
              )}

              {/* Credits */}
              <View style={[styles.creditsBadge, { backgroundColor: tier.color + "15" }]}>
                <Text style={[styles.creditsText, { color: tier.color }]}>
                  {tier.credits} · {tier.creditNote}
                </Text>
              </View>

              {/* Features */}
              <View style={styles.featureList}>
                {tier.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={[styles.featureCheck, { color: tier.color }]}>✓</Text>
                    <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  { backgroundColor: isCurrent ? colors.surface2 : tier.color },
                  isCurrent && { borderWidth: 1, borderColor: tier.color },
                ]}
                onPress={() => !isCurrent && handleSelect(tier)}
                disabled={isCurrent || checkoutMutation?.isPending}
              >
                {checkoutMutation?.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.ctaText, { color: isCurrent ? tier.color : "#fff" }]}>
                    {isCurrent ? "Current Plan" : tier.cta}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Enterprise Tiers */}
        <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 8 }]}>ENTERPRISE & PRODUCTION</Text>
        {ENTERPRISE_TIERS.map((tier) => {
          const isCurrent = currentTierId === tier.id;
          return (
            <View
              key={tier.id}
              style={[
                styles.tierCard,
                { backgroundColor: colors.surface, borderColor: isCurrent ? tier.color : colors.border },
                isCurrent && { borderWidth: 2 },
              ]}
            >
              <View style={styles.tierTopRow}>
                <View style={[styles.badge, { backgroundColor: tier.color + "20" }]}>
                  <Text style={[styles.badgeText, { color: tier.color }]}>{tier.badge}</Text>
                </View>
              </View>
              <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
              <Text style={[styles.enterprisePrice, { color: colors.foreground }]}>{tier.priceDisplay}</Text>
              <View style={[styles.creditsBadge, { backgroundColor: tier.color + "15" }]}>
                <Text style={[styles.creditsText, { color: tier.color }]}>
                  {tier.credits}{tier.creditNote ? ` · ${tier.creditNote}` : ""}
                </Text>
              </View>
              <View style={styles.featureList}>
                {tier.features.map((f) => (
                  <View key={f} style={styles.featureRow}>
                    <Text style={[styles.featureCheck, { color: tier.color }]}>✓</Text>
                    <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: tier.color }]}
                onPress={() => handleSelect(tier)}
              >
                <Text style={styles.ctaText}>{tier.cta}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Market comparison note */}
        <View style={[styles.comparisonNote, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.comparisonTitle, { color: colors.foreground }]}>Why Virelle?</Text>
          <Text style={[styles.comparisonText, { color: colors.muted }]}>
            Runway charges ~A$120/mo for 125 video seconds. ElevenLabs charges ~A$156/mo for voice only.
            Virelle's Indie plan at A$149/mo includes screenplay, voice acting, film score, and export.
            You're not paying for clips — you're paying for a complete film studio.
          </Text>
        </View>
      </ScrollView>
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
  headline: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 8, lineHeight: 30 },
  subheadline: { fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  billingToggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  billingText: { fontSize: 14, fontWeight: "600" },
  savingPill: {
    backgroundColor: "#10B98130",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  savingText: { color: "#10B981", fontSize: 10, fontWeight: "700" },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 12 },
  tierCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    gap: 12,
  },
  tierTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  currentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currentText: { fontSize: 11, fontWeight: "700" },
  tierName: { fontSize: 22, fontWeight: "800" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  tierPrice: { fontSize: 32, fontWeight: "800" },
  perMonth: { fontSize: 14 },
  annualSaving: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 6 },
  annualNote: { fontSize: 12, marginTop: -6 },
  enterprisePrice: { fontSize: 22, fontWeight: "700" },
  creditsBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: "flex-start" },
  creditsText: { fontSize: 12, fontWeight: "600" },
  featureList: { gap: 8 },
  featureRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  featureCheck: { fontSize: 13, fontWeight: "700", marginTop: 1 },
  featureText: { fontSize: 13, flex: 1, lineHeight: 18 },
  ctaButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  comparisonNote: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  comparisonTitle: { fontSize: 15, fontWeight: "700" },
  comparisonText: { fontSize: 13, lineHeight: 19 },
});
