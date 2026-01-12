import { Text, View } from "react-native";
import { Fonts, SemanticSpacing, typography, useTheme } from "@/theme";
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
    <View
      className={containerClassName}
      style={[{ marginTop: isFirst ? 0 : SemanticSpacing.gapXl }, style]}
    >
      {showDivider && !isFirst && (
        <View
          className={dividerClassName}
          style={{ backgroundColor: colors.border, marginBottom: SemanticSpacing.gapLg }}
        />
      )}
      {(title || description) && (
        <View
          className={headerContainerClassName}
          style={{ marginBottom: SemanticSpacing.gapSm }}
        >
          {title && (
            <Text
              className={titleClassName}
              style={[
                typography.uiLabel,
                {
                  color: colors.foreground,
                  fontFamily: Fonts.semiBold,
                  marginBottom: SemanticSpacing.gapXs,
                },
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
