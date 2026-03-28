import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

const PREFS_KEY = "virelle_notification_prefs_v1";

interface NotifPrefs {
  credits: boolean;
  projectUpdates: boolean;
  fundingDeadlines: boolean;
  newFeatures: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  credits: true,
  projectUpdates: true,
  fundingDeadlines: true,
  newFeatures: true,
  weeklyDigest: false,
};

const NOTIFICATION_ITEMS: {
  key: keyof NotifPrefs;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    key: "credits",
    label: "Credits & Billing",
    description: "Low credit warnings, top-up confirmations, subscription renewals",
    icon: "💳",
  },
  {
    key: "projectUpdates",
    label: "Project Updates",
    description: "AI generation complete, export ready, team member activity",
    icon: "🎬",
  },
  {
    key: "fundingDeadlines",
    label: "Funding Deadlines",
    description: "Reminders for upcoming film fund application deadlines",
    icon: "🌍",
  },
  {
    key: "newFeatures",
    label: "New Features",
    description: "Announcements about new tools and platform updates",
    icon: "✨",
  },
  {
    key: "weeklyDigest",
    label: "Weekly Digest",
    description: "A weekly summary of your project activity and industry news",
    icon: "📰",
  },
];

export default function NotificationSettings({ projectId }: { projectId?: number }) {
  const colors = useColors();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [permissionStatus, setPermissionStatus] = useState<string>("undetermined");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Load saved prefs
      const saved = await AsyncStorage.getItem(PREFS_KEY);
      if (saved) {
        try {
          setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
        } catch {}
      }
      // Check permission status
      if (Platform.OS !== "web") {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);
      } else {
        setPermissionStatus("granted");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleToggle = async (key: keyof NotifPrefs, value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  };

  const requestPermission = async () => {
    if (Platform.OS === "web") return;
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === "granted") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  };

  const permissionDenied = permissionStatus === "denied";
  const permissionGranted = permissionStatus === "granted";

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🔔</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Notification Settings</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Choose which notifications you receive from Virelle Studios.
          </Text>
        </View>

        {/* Permission Banner */}
        {!permissionGranted && (
          <TouchableOpacity
            style={[
              styles.permissionBanner,
              {
                backgroundColor: permissionDenied ? colors.error + "15" : "#d97706" + "15",
                borderColor: permissionDenied ? colors.error + "40" : "#d97706" + "40",
              },
            ]}
            onPress={permissionDenied ? openSettings : requestPermission}
          >
            <Text style={styles.permissionIcon}>{permissionDenied ? "⚠️" : "🔔"}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.permissionTitle,
                  { color: permissionDenied ? colors.error : "#d97706" },
                ]}
              >
                {permissionDenied
                  ? "Notifications blocked"
                  : "Enable push notifications"}
              </Text>
              <Text style={[styles.permissionDesc, { color: colors.muted }]}>
                {permissionDenied
                  ? "Tap to open device settings and allow notifications."
                  : "Tap to allow Virelle Studios to send you notifications."}
              </Text>
            </View>
            <Text style={[styles.permissionArrow, { color: colors.muted }]}>›</Text>
          </TouchableOpacity>
        )}

        {/* Notification toggles */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {NOTIFICATION_ITEMS.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.row,
                index < NOTIFICATION_ITEMS.length - 1 && {
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.rowDesc, { color: colors.muted }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={(v) => handleToggle(item.key, v)}
                disabled={!permissionGranted}
                trackColor={{ false: colors.border, true: "#d97706" + "80" }}
                thumbColor={prefs[item.key] ? "#d97706" : colors.muted}
                ios_backgroundColor={colors.border}
              />
            </View>
          ))}
        </View>

        {/* Info note */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.infoText, { color: colors.muted }]}>
            These preferences are stored on your device. Push notifications are delivered via Expo
            Notifications and require your device to have an active internet connection.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  header: { alignItems: "center", gap: 8, paddingVertical: 8 },
  headerIcon: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  permissionIcon: { fontSize: 22 },
  permissionTitle: { fontSize: 14, fontWeight: "600" },
  permissionDesc: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  permissionArrow: { fontSize: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  rowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: { fontSize: 22, width: 30, textAlign: "center" },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  infoText: { fontSize: 12, lineHeight: 18 },
});
