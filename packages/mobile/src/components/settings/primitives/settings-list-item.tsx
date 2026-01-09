import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Fonts, FontSizes, Radius, Spacing, useTheme } from "@/theme";
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [onPress]);

  // Match desktop selection states: dark:bg-accent/80 bg-primary/12
  const pressedBgColor = isDark
    ? `${colors.accent}CC` // 80% opacity
    : `${colors.primary}1F`; // 12% opacity (~0.12 * 255 = 31 = 0x1F)

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={!onPress}
      style={{
        marginHorizontal: Spacing[3],
        marginVertical: Spacing[0.5],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: Spacing[1.5],
          paddingVertical: Spacing[1],
          borderRadius: Radius.md,
          backgroundColor: isPressed && onPress ? pressedBgColor : "transparent",
          minHeight: 36,
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {/* Small icon before title (e.g., lock icon) */}
            {icon && <View style={{ flexShrink: 0 }}>{icon}</View>}

            {/* Title */}
            <Text
              style={{
                color: colors.foreground,
                fontSize: FontSizes.uiLabel,
                fontFamily: Fonts.regular,
                flexShrink: 1,
              }}
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
                  borderColor: `${colors.border}80`,
                  borderWidth: 1,
                  paddingHorizontal: 4,
                  paddingBottom: 1,
                  borderRadius: Radius.DEFAULT,
                  flexShrink: 0,
                }}
              >
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FontSizes.micro,
                    fontFamily: Fonts.regular,
                    lineHeight: FontSizes.micro,
                  }}
                >
                  {badge}
                </Text>
              </View>
            )}
          </View>

          {/* Subtitle/description */}
          {subtitle && (
            <Text
              style={{
                color: `${colors.mutedForeground}99`, // 60% opacity like desktop
                fontSize: FontSizes.micro,
                fontFamily: Fonts.regular,
                marginTop: 1,
                lineHeight: FontSizes.micro * 1.3,
              }}
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
