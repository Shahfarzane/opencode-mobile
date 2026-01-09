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
  icon,
  modeIcon,
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {icon && <View style={{ marginRight: 2 }}>{icon}</View>}
            <Text
              style={{
                color: colors.foreground,
                fontSize: 17,
                fontFamily: Fonts.regular,
                flexShrink: 1,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {badge && (
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderColor: colors.border + "80", // 50% opacity like desktop
                  borderWidth: 1,
                  paddingHorizontal: 4, // px-1 like desktop
                  paddingBottom: 1, // pb-px like desktop
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FontSizes.micro,
                    fontFamily: Fonts.regular,
                    lineHeight: FontSizes.micro, // leading-none like desktop
                  }}
                >
                  {badge}
                </Text>
              </View>
            )}
            {modeIcon && <View style={{ marginLeft: 2, flexShrink: 0 }}>{modeIcon}</View>}
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
