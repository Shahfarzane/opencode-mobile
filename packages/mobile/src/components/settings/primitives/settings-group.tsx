import React from "react";
import { Children } from "react";
import { Text, View } from "react-native";
import { FixedLineHeights, FontSizes, Fonts, useTheme } from "@/theme";
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

  const childArray = Children.toArray(children).filter(Boolean);

  const lastChild = childArray.at(-1);

  const content = childArray.flatMap((child) => {
    if (child === lastChild) return [child];
    const key = typeof child === "object" && child !== null && "key" in child
      ? `separator-${String(child.key)}`
      : `separator-${String(child)}`;
    return [
      child,
      <View
        key={key}
        className={settingsGroupStyles.separator({})}
        style={{ backgroundColor: colors.border }}
      />,
    ];
  });

  return (
    <View className={settingsGroupStyles.container({ className })} style={style}>
      <View className={settingsGroupStyles.group({})}>{content}</View>
      {footer && (
        <Text
          className={settingsGroupStyles.footer({})}
          style={{
            color: colors.mutedForeground,
            fontSize: FontSizes.uiLabel,
            fontFamily: Fonts.regular,
            lineHeight: FixedLineHeights.ui,
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
