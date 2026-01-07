import React from "react";
import { Text, View } from "react-native";
import { useTheme, Fonts } from "@/theme";
import { settingsGroupStyles } from "./settings-group.styles";
import type { SettingsGroupProps } from "./settings-group.types";

const DISPLAY_NAME = "SettingsGroup";

/**
 * Native iOS-style grouped settings container.
 * Provides rounded card styling with optional header/footer.
 *
 * @example
 * <SettingsGroup header="ACCOUNT" footer="Your account information">
 *   <SettingsRow title="Email" value="user@example.com" />
 *   <SettingsRow title="Password" onPress={changePassword} />
 * </SettingsGroup>
 */
export function SettingsGroup({
  footer,
  children,
  className,
  style,
}: SettingsGroupProps) {
  const { colors } = useTheme();

  const childArray = React.Children.toArray(children).filter(Boolean);

  return (
    <View className={settingsGroupStyles.container({ className })} style={style}>
      <View className={settingsGroupStyles.group({})}>
        {childArray}
      </View>
      {footer && (
        <Text
          className={settingsGroupStyles.footer({})}
          style={{
            color: colors.mutedForeground,
            fontSize: 13,
            fontFamily: Fonts.regular,
            lineHeight: 18,
          }}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}

SettingsGroup.displayName = DISPLAY_NAME;

export type { SettingsGroupProps };
