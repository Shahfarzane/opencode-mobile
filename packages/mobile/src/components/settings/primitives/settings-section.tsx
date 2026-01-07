import { Text, View } from "react-native";
import { Fonts, typography, useTheme } from "@/theme";
import { settingsSectionStyles } from "./settings-section.styles";
import type { SettingsSectionProps } from "./settings-section.types";

const DISPLAY_NAME = "SettingsSection";

/**
 * Settings section component for grouping related settings.
 *
 * @example
 * <SettingsSection title="Account" description="Manage your account settings">
 *   <SettingsRow title="Email" value="user@example.com" />
 *   <SettingsRow title="Password" onPress={changePassword} />
 * </SettingsSection>
 */
export function SettingsSection({
  title,
  description,
  children,
  showDivider = true,
  isFirst = false,
  className,
  style,
}: SettingsSectionProps) {
  const { colors } = useTheme();

  const containerClassName = settingsSectionStyles.container({ isFirst, className });
  const dividerClassName = settingsSectionStyles.divider({});
  const headerContainerClassName = settingsSectionStyles.headerContainer({});
  const titleClassName = settingsSectionStyles.title({});
  const descriptionClassName = settingsSectionStyles.description({});
  const contentClassName = settingsSectionStyles.content({});

  return (
    <View className={containerClassName} style={style}>
      {showDivider && !isFirst && (
        <View
          className={dividerClassName}
          style={{ backgroundColor: colors.border }}
        />
      )}
      {(title || description) && (
        <View className={headerContainerClassName}>
          {title && (
            <Text
              className={titleClassName}
              style={[
                typography.uiLabel,
                { color: colors.foreground, fontFamily: Fonts.semiBold },
              ]}
            >
              {title}
            </Text>
          )}
          {description && (
            <Text
              className={descriptionClassName}
              style={[typography.meta, { color: colors.mutedForeground }]}
            >
              {description}
            </Text>
          )}
        </View>
      )}
      <View className={contentClassName}>{children}</View>
    </View>
  );
}

SettingsSection.displayName = DISPLAY_NAME;

export type { SettingsSectionProps };
