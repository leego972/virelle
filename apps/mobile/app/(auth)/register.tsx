import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { refresh } = useAuth({ autoFetch: false });
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await startOAuthLogin();
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backText, { color: colors.muted }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: colors.foreground }]}>
            Join Virelle Studios
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Start your cinematic journey with 100 free credits
          </Text>

          <View style={styles.tierCards}>
            {[
              { tier: "Free", price: "$0", credits: "100 credits", color: colors.muted },
              { tier: "Amateur", price: "$500/mo", credits: "5,000 credits", color: colors.primary },
              { tier: "Studio", price: "$15k/mo", credits: "250,000 credits", color: colors.accent },
            ].map((t) => (
              <View key={t.tier} style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.tierName, { color: t.color }]}>{t.tier}</Text>
                <Text style={[styles.tierPrice, { color: colors.foreground }]}>{t.price}</Text>
                <Text style={[styles.tierCredits, { color: colors.muted }]}>{t.credits}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, { backgroundColor: colors.primary }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpText}>Create Account with Google</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.terms, { color: colors.muted }]}>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  backButton: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 24 },
  backText: { fontSize: 14 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  logo: { width: 72, height: 72 },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  tierCards: { flexDirection: "row", gap: 10, width: "100%" },
  tierCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 4 },
  tierName: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  tierPrice: { fontSize: 13, fontWeight: "600" },
  tierCredits: { fontSize: 11 },
  signUpButton: { width: "100%", height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  signUpText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  terms: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});
