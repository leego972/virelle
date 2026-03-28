/**
 * WebViewTool
 *
 * Renders any Virelle Studios website feature inside an authenticated WebView.
 * Used as the fallback for tools that don't have a dedicated native component yet.
 *
 * Features:
 * - Injects the user's session token so the website recognises the user
 * - Hides the website nav/header so it feels native
 * - Shows a loading bar while the page loads
 * - Handles errors gracefully with a retry button
 */

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getApiBaseUrl } from "@/constants/oauth";
import * as SecureStore from "expo-secure-store";
import { SESSION_TOKEN_KEY } from "@/constants/oauth";

interface WebViewToolProps {
  /** Tool label shown in the header */
  label: string;
  /** Website path, e.g. "/projects/42/storyboard" (with real IDs substituted) */
  webPath: string;
  /** Optional project ID to substitute into :projectId / :id placeholders */
  projectId?: number;
}

/** Inject CSS to hide the website's navigation bar and footer so it feels native */
const HIDE_NAV_CSS = `
  (function() {
    var style = document.createElement('style');
    style.textContent = \`
      nav, header, .navbar, [class*="nav-"], [class*="header-"],
      [class*="Navbar"], [class*="Header"], [data-testid="navbar"],
      footer, [class*="footer-"], [class*="Footer"] {
        display: none !important;
      }
      body { padding-top: 0 !important; margin-top: 0 !important; }
    \`;
    document.head.appendChild(style);
  })();
  true;
`;

/** Inject the session token into document cookies so the website authenticates the user */
function buildTokenInjectionScript(token: string): string {
  return `
    (function() {
      document.cookie = 'session_token=${token}; path=/; SameSite=Lax';
      document.cookie = 'auth_token=${token}; path=/; SameSite=Lax';
    })();
    true;
  `;
}

export default function WebViewTool({ label, webPath, projectId }: WebViewToolProps) {
  const colors = useColors();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Resolve the full URL
  const baseUrl = getApiBaseUrl();
  const resolvedPath = webPath
    .replace(/:projectId/g, String(projectId ?? ""))
    .replace(/:id/g, String(projectId ?? ""))
    .replace(/:sceneId/g, "");
  const fullUrl = baseUrl ? `${baseUrl}${resolvedPath}` : resolvedPath;

  // Load session token on mount
  React.useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
        setSessionToken(token);
      } catch (_) {
        // No token — user will see the login page in the WebView
      }
    })();
  }, []);

  const handleLoadEnd = () => {
    setLoadProgress(1);
    // Inject CSS to hide nav and inject auth token
    webViewRef.current?.injectJavaScript(HIDE_NAV_CSS);
    if (sessionToken) {
      webViewRef.current?.injectJavaScript(buildTokenInjectionScript(sessionToken));
    }
  };

  if (Platform.OS === "web") {
    // On web preview, just show a link
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>{label}</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.icon}>🌐</Text>
          <Text style={[styles.webTitle, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.webDesc, { color: colors.muted }]}>
            This tool opens in the full web app.
          </Text>
          <TouchableOpacity
            style={[styles.openBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (typeof window !== "undefined") window.open(fullUrl, "_blank");
            }}
          >
            <Text style={styles.openBtnText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {label}
        </Text>
        <TouchableOpacity
          style={styles.reloadBtn}
          onPress={() => {
            setHasError(false);
            webViewRef.current?.reload();
          }}
        >
          <Text style={[styles.reloadText, { color: colors.muted }]}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {loadProgress > 0 && loadProgress < 1 && (
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${loadProgress * 100}%` },
            ]}
          />
        </View>
      )}

      {/* Error state */}
      {hasError ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            Could not load {label}
          </Text>
          <Text style={[styles.errorDesc, { color: colors.muted }]}>
            Check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setHasError(false);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: fullUrl }}
          style={styles.webview}
          onLoadProgress={({ nativeEvent }) => setLoadProgress(nativeEvent.progress)}
          onLoadEnd={handleLoadEnd}
          onError={() => setHasError(true)}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode >= 500) setHasError(true);
          }}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Loading {label}…</Text>
            </View>
          )}
          // Allow all navigation within the Virelle domain
          onNavigationStateChange={(navState: WebViewNavigation) => {
            // If navigating away from the Virelle domain, open in system browser
            if (navState.url && !navState.url.includes("virellestudios") && !navState.url.startsWith(baseUrl)) {
              webViewRef.current?.stopLoading();
            }
          }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    paddingTop: 52, // account for status bar
  },
  backBtn: { minWidth: 48, alignItems: "flex-start" },
  back: { fontSize: 16 },
  title: { fontSize: 16, fontWeight: "600", flex: 1, textAlign: "center" },
  reloadBtn: { minWidth: 48, alignItems: "flex-end" },
  reloadText: { fontSize: 20 },
  progressBar: { height: 2, width: "100%" },
  progressFill: { height: 2 },
  webview: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  icon: { fontSize: 48 },
  webTitle: { fontSize: 20, fontWeight: "700" },
  webDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  openBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  openBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 18, fontWeight: "700" },
  errorDesc: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
});
