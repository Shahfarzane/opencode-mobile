import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { FontSizes, Fonts, Spacing, useTheme } from "@/theme";
import type { SettingsRowProps } from "./settings-row.types";

const DISPLAY_NAME = "SettingsRow";

/**
 * Native iOS-style settings row component.
 */
export function SettingsRow(props: SettingsRowProps) {
  const { colors } = useTheme();
  const { title, value, destructive } = props;

  const isToggle = "toggle" in props && props.toggle !== undefined;
  const isNavigation = "onPress" in props && typeof props.onPress === "function";

  const handlePress = useCallback(() => {
    if (isNavigation && props.onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      props.onPress();
    }
  }, [isNavigation, props]);

  const handleToggleChange = useCallback(
    (newValue: boolean) => {
      if (isToggle && props.onToggleChange) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        props.onToggleChange(newValue);
      }
    },
    [isToggle, props]
  );

  const textColor = destructive ? colors.destructive : colors.foreground;

  const rowContent = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 44,
        paddingHorizontal: Spacing[4],
      }}
    >
      <Text
        style={{
          color: textColor,
          fontSize: FontSizes.markdown, // 16px - close to iOS HIG 17pt
          fontFamily: Fonts.regular,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {value && !isToggle && (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FontSizes.markdown, // 16px - close to iOS HIG 17pt
              fontFamily: Fonts.regular,
            }}
            numberOfLines={1}
          >
            {value}
          </Text>
        )}
        {isToggle && (
          <Switch
            value={props.toggle}
            onValueChange={handleToggleChange}
            trackColor={{
              false: colors.muted,
              true: colors.primary,
            }}
            thumbColor={colors.card}
            ios_backgroundColor={colors.muted}
          />
        )}
        {isNavigation && !isToggle && (
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
    </View>
  );

  if (isNavigation) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
        })}
      >
        {rowContent}
      </Pressable>
    );
  }

  return rowContent;
}

SettingsRow.displayName = DISPLAY_NAME;

export type { SettingsRowProps };
