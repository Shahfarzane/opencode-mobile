import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MobileSizes, Radius, SemanticSpacing, Spacing, typography, useTheme } from "@/theme";
import { withOpacity, OPACITY } from "@/utils/colors";
import type { SettingsListItemProps } from "./settings-list-item.types";

const DISPLAY_NAME = "SettingsListItem";

/**
 * Settings list item component matching desktop design.
 * Uses rounded card style with press states.
 */
export function SettingsListItem({
  title,
  subtitle,
  badge,
  icon,
  modeIcon,
  leftIcon,
  rightContent,
  onPress,
}: SettingsListItemProps) {
  const { colors, isDark } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    if (onPress) {
      impactAsync(ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [onPress]);

  // Match desktop selection states: dark:bg-accent/80 bg-primary/12
  const pressedBgColor = isDark
    ? withOpacity(colors.accent, OPACITY.strong)
    : withOpacity(colors.primary, OPACITY.selected);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={!onPress}
      style={{
        backgroundColor: isPressed && onPress ? pressedBgColor : "transparent",
        borderRadius: Radius.md,
        minHeight: MobileSizes.buttonMd,
        paddingHorizontal: Spacing[4],
        paddingVertical: SemanticSpacing.gapSm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: SemanticSpacing.gapSm,
          flex: 1,
        }}
      >
        {/* Left icon (e.g., provider logo) */}
        {leftIcon && (
          <View style={{ marginRight: Spacing[2], flexShrink: 0 }}>
            {leftIcon}
          </View>
        )}

        {/* Main content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SemanticSpacing.gapSm }}>
            {/* Small icon before title (e.g., lock icon) */}
            {icon && <View style={{ flexShrink: 0 }}>{icon}</View>}

            {/* Title */}
            <Text
              style={[typography.uiLabel, { color: colors.foreground, flexShrink: 1 }]}
              numberOfLines={1}
            >
              {title}
            </Text>

            {/* Mode icon (e.g., agent mode indicator) */}
            {modeIcon && <View style={{ flexShrink: 0 }}>{modeIcon}</View>}

            {/* Badge (e.g., "system", "user", "project") */}
            {badge && (
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderColor: withOpacity(colors.border, OPACITY.half),
                  borderWidth: 1,
                  paddingHorizontal: Spacing[1],
                  paddingBottom: 1,
                  borderRadius: Radius.DEFAULT,
                  flexShrink: 0,
                }}
              >
                <Text style={[typography.micro, { color: colors.mutedForeground }]}>
                  {badge}
                </Text>
              </View>
            )}
          </View>

          {/* Subtitle/description */}
          {subtitle && (
            <Text
              style={[
                typography.micro,
                {
                  color: withOpacity(colors.mutedForeground, OPACITY.muted),
                  marginTop: 1,
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right content (e.g., model count) */}
        {rightContent && (
          <View style={{ marginLeft: Spacing[2], flexShrink: 0 }}>
            {rightContent}
          </View>
        )}
      </View>
    </Pressable>
  );
}

SettingsListItem.displayName = DISPLAY_NAME;

export type { SettingsListItemProps };
