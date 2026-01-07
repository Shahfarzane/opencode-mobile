import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Fonts, FontSizes, Spacing, useTheme } from "@/theme";
import type { SettingsListItemProps } from "./settings-list-item.types";

const DISPLAY_NAME = "SettingsListItem";

/**
 * Native iOS-style settings list item component for displaying selectable items.
 */
export function SettingsListItem({
  title,
  subtitle,
  badge,
  onPress,
  showChevron = true,
}: SettingsListItemProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 44,
          paddingHorizontal: Spacing[4],
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 17,
                fontFamily: Fonts.regular,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {badge && (
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  borderWidth: 1,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FontSizes.micro,
                    fontFamily: Fonts.regular,
                  }}
                >
                  {badge}
                </Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 15,
                fontFamily: Fonts.regular,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {showChevron && onPress && (
          <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
            <Path
              d="M1 1l5 5-5 5"
              stroke={colors.mutedForeground}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
    </Pressable>
  );
}

SettingsListItem.displayName = DISPLAY_NAME;

export type { SettingsListItemProps };
