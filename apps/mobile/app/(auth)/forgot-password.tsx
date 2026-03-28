import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { startOAuthLogin } from "@/constants/oauth";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();

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
          <Text style={[styles.title, { color: colors.foreground }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Password reset is handled through your Google account. Sign in with Google to access your account.
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => { startOAuthLogin(); router.back(); }}
          >
            <Text style={styles.buttonText}>Sign In with Google</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  backButton: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 24 },
  backText: { fontSize: 14 },
  content: { flex: 1, justifyContent: "center", gap: 20 },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 15, lineHeight: 22 },
  button: { height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
