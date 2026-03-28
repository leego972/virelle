import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
export default function PrivacyScreen({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const router = useRouter();
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={{ width: 48 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={[styles.lastUpdated, { color: colors.muted }]}>Last updated: March 2025</Text>
        {[
          ["Information We Collect", "We collect information you provide directly to us, such as when you create an account, use our AI tools, or contact us for support. This includes your name, email address, and content you create using our platform."],
          ["How We Use Your Information", "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions."],
          ["Data Storage and Security", "Your data is stored securely on our servers. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction."],
          ["AI-Generated Content", "Content generated using our AI tools is associated with your account. You retain ownership of the creative content you produce, subject to our Terms of Service."],
          ["Sharing Your Information", "We do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers who assist us in operating our platform."],
          ["Contact Us", "If you have questions about this Privacy Policy, please contact us at privacy@virellestudios.com"],
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
