// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "folder.fill": "folder",
  "message.fill": "chat",
  "play.rectangle.fill": "movie",
  "person.fill": "person",
  // Tools
  "doc.text.fill": "description",
  "camera.fill": "camera",
  "film.fill": "theaters",
  "wand.and.stars": "auto-fix-high",
  "list.bullet.clipboard.fill": "assignment",
  "dollarsign.circle.fill": "attach-money",
  "captions.bubble.fill": "subtitles",
  "checkmark.shield.fill": "verified-user",
  "mic.fill": "mic",
  "scissors": "content-cut",
  "video.fill": "videocam",
  "sparkles": "auto-awesome",
  "chart.bar.fill": "bar-chart",
  // Actions
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "pencil": "edit",
  "trash.fill": "delete",
  "square.and.arrow.up": "share",
  "arrow.left": "arrow-back",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  // UI
  "gear": "settings",
  "bell.fill": "notifications",
  "magnifyingglass": "search",
  "ellipsis": "more-horiz",
  "ellipsis.circle": "more-vert",
  "star.fill": "star",
  "heart.fill": "favorite",
  "link": "link",
  "person.2.fill": "group",
  "crown.fill": "workspace-premium",
  "bolt.fill": "bolt",
  "clock.fill": "access-time",
  "calendar": "calendar-today",
  "photo.fill": "photo",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "arrow.clockwise": "refresh",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "lock.fill": "lock",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "creditcard.fill": "credit-card",
  "gift.fill": "card-giftcard",
  "person.badge.plus": "person-add",
  "rectangle.on.rectangle": "copy-all",
  "arrow.down.circle.fill": "download",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
