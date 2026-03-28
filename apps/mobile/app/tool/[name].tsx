import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// Lazy-loaded tool screens
import ScriptWriterScreen from "@/components/tools/ScriptWriter";
import StoryboardScreen from "@/components/tools/Storyboard";
import ShotListScreen from "@/components/tools/ShotList";
import VideoGenerationScreen from "@/components/tools/VideoGeneration";
import TrailerScreen from "@/components/tools/Trailer";
import DialogueScreen from "@/components/tools/Dialogue";
import BudgetScreen from "@/components/tools/Budget";
import ContinuityScreen from "@/components/tools/Continuity";
import SubtitlesScreen from "@/components/tools/Subtitles";
import SceneBuilderScreen from "@/components/tools/SceneBuilder";
import CharactersScreen from "@/components/tools/Characters";
import TeamScreen from "@/components/tools/Team";
import SubscriptionScreen from "@/components/tools/Subscription";
import ReferralsScreen from "@/components/tools/Referrals";
import CreditsScreen from "@/components/tools/Credits";
import AllToolsScreen from "@/components/tools/AllTools";
import FilmGeneratorScreen from "@/components/tools/FilmGenerator";
import PrivacyScreen from "@/components/tools/Privacy";
import TermsScreen from "@/components/tools/Terms";
import FilmPostProductionScreen from "@/components/tools/FilmPostProduction";
import FundingDirectoryScreen from "@/components/tools/FundingDirectory";
import NotificationSettingsScreen from "@/components/tools/NotificationSettings";

const TOOL_MAP: Record<string, React.ComponentType<{ projectId?: number }>> = {
  "script-writer": ScriptWriterScreen,
  "storyboard": StoryboardScreen,
  "shot-list": ShotListScreen,
  "video-generation": VideoGenerationScreen,
  "trailer": TrailerScreen,
  "dialogue": DialogueScreen,
  "budget": BudgetScreen,
  "continuity": ContinuityScreen,
  "subtitles": SubtitlesScreen,
  "scene-builder": SceneBuilderScreen,
  "characters": CharactersScreen,
  "team": TeamScreen,
  "subscription": SubscriptionScreen,
  "referrals": ReferralsScreen,
  "credits": CreditsScreen,
  "all-tools": AllToolsScreen,
  "film-generator": FilmGeneratorScreen,
  "privacy": PrivacyScreen,
  "terms": TermsScreen,
  "film-post-production": FilmPostProductionScreen,
  "funding-directory": FundingDirectoryScreen,
  "notifications": NotificationSettingsScreen,
};

export default function ToolScreen() {
  const { name, projectId } = useLocalSearchParams<{ name: string; projectId?: string }>();
  const colors = useColors();
  const router = useRouter();

  const ToolComponent = TOOL_MAP[name];

  if (!ToolComponent) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.notFoundIcon}>🔧</Text>
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Tool Not Found</Text>
          <Text style={[styles.notFoundSubtitle, { color: colors.muted }]}>
            The tool "{name}" is not available yet.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return <ToolComponent projectId={projectId ? Number(projectId) : undefined} />;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 14 },
  back: { fontSize: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundIcon: { fontSize: 48 },
  notFoundTitle: { fontSize: 20, fontWeight: "700" },
  notFoundSubtitle: { fontSize: 14, textAlign: "center" },
});
