import { Pressable, Switch, Text, View } from "react-native";
import { typography, useTheme } from "@/theme";
import { settingsSwitchStyles } from "./settings-switch.styles";
import type { SettingsSwitchProps } from "./settings-switch.types";

const DISPLAY_NAME = "SettingsSwitch";

/**
 * Settings switch component with label and description.
 *
 * @example
 * <SettingsSwitch
 *   label="Enable notifications"
 *   description="Receive push notifications"
 *   value={isEnabled}
 *   onChange={setIsEnabled}
 * />
 */
export function SettingsSwitch({
  label,
  description,
  value,
  onChange,
  disabled = false,
  className,
  style,
}: SettingsSwitchProps) {
  const { colors } = useTheme();

  const containerClassName = settingsSwitchStyles.container({
    isDisabled: disabled,
    className,
  });
  const contentClassName = settingsSwitchStyles.content({});
  const labelClassName = settingsSwitchStyles.label({});
  const descriptionClassName = settingsSwitchStyles.description({});

  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={containerClassName}
      style={style}
    >
      <View className={contentClassName}>
        <Text
          className={labelClassName}
          style={[typography.uiLabel, { color: colors.foreground }]}
        >
          {label}
        </Text>
        {description && (
          <Text
            className={descriptionClassName}
            style={[typography.meta, { color: colors.mutedForeground }]}
          >
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor={colors.card}
      />
    </Pressable>
  );
}

SettingsSwitch.displayName = DISPLAY_NAME;

export type { SettingsSwitchProps };
