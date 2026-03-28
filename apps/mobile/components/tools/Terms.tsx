import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
export default function TermsScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Terms of Service</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={[styles.lastUpdated, { color: colors.muted }]}>Last updated: March 2025</Text>
        {[
          ["Acceptance of Terms", "By accessing and using Virelle Studios, you accept and agree to be bound by the terms and provision of this agreement."],
          ["Use of AI Tools", "Our AI-powered tools are provided for legitimate film production purposes. You agree not to use our tools to generate harmful, illegal, or infringing content."],
          ["Credits and Subscriptions", "Credits are non-refundable once used. Subscription fees are billed monthly and may be cancelled at any time. Unused credits do not roll over between billing periods."],
          ["Intellectual Property", "You retain ownership of the creative content you produce using our platform. By using our service, you grant us a limited license to process your content for the purpose of providing our services."],
          ["Limitation of Liability", "Virelle Studios shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services."],
          ["Contact", "For questions about these Terms, contact us at legal@virellestudios.com"],
        ].map(([heading, body]) => (
          <View key={heading} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{heading}</Text>
            <Text style={[styles.sectionBody, { color: colors.muted }]}>{body}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  back: { fontSize: 16 }, title: { fontSize: 17, fontWeight: "600" },
  lastUpdated: { fontSize: 12, marginBottom: 20 },
  section: { marginBottom: 20 }, sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 }, sectionBody: { fontSize: 14, lineHeight: 22 },
});
