import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const ONBOARDING_KEY = "virelle_onboarding_v1_done";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEPS = [
  {
    icon: "🎬",
    title: "Create Your Project",
    description:
      "Start by creating a new project. Give it a title, genre, and logline. Your project is the container for your entire film — script, storyboard, characters, sound, and more.",
    tip: "A strong logline (one sentence that captures your story) helps the AI generate better content throughout your project.",
    color: "#b45309",
  },
  {
    icon: "📝",
    title: "Write Your Script",
    description:
      "Use the AI Script Writer to generate a full screenplay from your premise. Choose your genre and tone, then let the AI draft your script — or write it yourself and edit freely.",
    tip: "Script generation costs 10 credits. You can regenerate as many times as you like to find the right voice.",
    color: "#0a7ea4",
  },
  {
    icon: "🎨",
    title: "Build Your Storyboard",
    description:
      "Visualise your film panel by panel. Describe each scene and camera angle, and the AI generates a storyboard description. Works offline — panels sync when you reconnect.",
    tip: "Each panel costs 5 credits. Use the Shot List tool to plan camera angles before storyboarding.",
    color: "#7c3aed",
  },
  {
    icon: "🎭",
    title: "Develop Your Characters",
    description:
      "Add your cast with names, roles, and descriptions. The Dialogue Editor lets you write and refine character dialogue scene by scene, with AI assistance to match each voice.",
    tip: "The more detail you give each character, the more consistent the AI-generated dialogue will be.",
    color: "#059669",
  },
  {
    icon: "🎵",
    title: "Post-Production Sound",
    description:
      "Layer ADR (re-recorded dialogue), Foley (ambient sounds), and a Score (AI-generated music cues) onto your film. Mix all tracks in the Mix Panel inside each project.",
    tip: "AI suggestions for ADR, Foley, and Score are available — each costs a small number of credits.",
    color: "#dc2626",
  },
  {
    icon: "🌍",
    title: "Subtitles & Funding",
    description:
      "Export your film with subtitles in 130+ languages. Browse 94 international film funds in the Funding Directory and generate a professional application package.",
    tip: "The Funding Directory is a working pack — always verify exact requirements on each fund's live portal before submitting.",
    color: "#d97706",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [doNotShow, setDoNotShow] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleFinish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    if (doNotShow) await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      {/* Top accent bar */}
      <View style={[styles.accentBar, { backgroundColor: current.color }]} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.logoRow}>
          <View style={[styles.logoBox, { backgroundColor: current.color + "20" }]}>
            <Text style={styles.logoText}>VS</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Virelle Studios — Getting Started
          </Text>
        </View>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setStep(i)}>
            <View
              style={[
                styles.dot,
                {
                  width: i === step ? 24 : 8,
                  backgroundColor:
                    i === step
                      ? current.color
                      : i < step
                      ? current.color + "70"
                      : colors.border,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: current.color + "18",
              borderColor: current.color + "35",
            },
          ]}
        >
          <Text style={styles.icon}>{current.icon}</Text>
        </View>

        {/* Step label */}
        <Text style={[styles.stepLabel, { color: current.color }]}>
          Step {step + 1} of {STEPS.length}
        </Text>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>{current.title}</Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.muted }]}>{current.description}</Text>

        {/* Tip box */}
        <View
          style={[
            styles.tipBox,
            {
              backgroundColor: current.color + "0d",
              borderColor: current.color + "22",
            },
          ]}
        >
          <Text style={[styles.tipLabel, { color: current.color }]}>Tip: </Text>
          <Text style={[styles.tipText, { color: colors.muted }]}>{current.tip}</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.buttonRow}>
          {!isFirst ? (
            <TouchableOpacity
              style={[styles.backButton, { borderColor: colors.border }]}
              onPress={handleBack}
            >
              <Text style={[styles.backText, { color: colors.muted }]}>‹ Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: current.color }]}
            onPress={handleNext}
          >
            <Text style={styles.nextText}>
              {isLast ? "✓  Start Creating" : "Next  ›"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Do not show again */}
        <TouchableOpacity
          style={styles.doNotShowRow}
          onPress={() => setDoNotShow((v) => !v)}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: doNotShow ? current.color : colors.border,
                backgroundColor: doNotShow ? current.color : "transparent",
              },
            ]}
          >
            {doNotShow && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.doNotShowText, { color: colors.muted }]}>
            Do not show this again
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  accentBar: { height: 3, width: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  logoBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  headerTitle: { fontSize: 13, fontWeight: "600", flex: 1 },
  skipText: { fontSize: 14 },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dot: { height: 6, borderRadius: 3 },
  contentContainer: {
    padding: 24,
    alignItems: "center",
    gap: 16,
    paddingBottom: 32,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  icon: { fontSize: 44 },
  stepLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  description: { fontSize: 15, lineHeight: 24, textAlign: "center" },
  tipBox: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tipLabel: { fontSize: 13, fontWeight: "600" },
  tipText: { fontSize: 13, lineHeight: 20, flex: 1 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    gap: 12,
  },
  buttonRow: { flexDirection: "row", gap: 10 },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  backText: { fontSize: 15, fontWeight: "500" },
  nextButton: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  nextText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  doNotShowRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { color: "#fff", fontSize: 10, fontWeight: "700" },
  doNotShowText: { fontSize: 13 },
});
