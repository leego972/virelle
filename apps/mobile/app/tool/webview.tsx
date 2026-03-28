/**
 * WebView Tool Route
 *
 * Handles /tool/webview?label=...&webPath=...&projectId=...
 * Used by the All Tools screen to open website features that don't have a native component.
 */
import { useLocalSearchParams } from "expo-router";
import WebViewTool from "@/components/tools/WebViewTool";

export default function WebViewToolScreen() {
  const { label, webPath, projectId } = useLocalSearchParams<{
    label: string;
    webPath: string;
    projectId?: string;
  }>();

  return (
    <WebViewTool
      label={label ?? "Tool"}
      webPath={webPath ?? "/"}
      projectId={projectId ? Number(projectId) : undefined}
    />
  );
}
