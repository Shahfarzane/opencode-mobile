import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { typography, useTheme } from "@/theme";
import { settingsTextFieldStyles } from "./settings-text-field.styles";
import type { SettingsTextFieldProps } from "./settings-text-field.types";

const DISPLAY_NAME = "SettingsTextField";

/**
 * Settings text field component with label and validation.
 *
 * @example
 * <SettingsTextField
 *   label="Name"
 *   description="Enter your display name"
 *   value={name}
 *   onChangeText={setName}
 *   required
 * />
 */
export function SettingsTextField({
  label,
  description,
  error,
  required = false,
  className,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: SettingsTextFieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const state = error ? "error" : isFocused ? "focused" : "default";

  const containerClassName = settingsTextFieldStyles.container({ className });
  const labelRowClassName = settingsTextFieldStyles.labelRow({});
  const labelClassName = settingsTextFieldStyles.label({});
  const requiredClassName = settingsTextFieldStyles.required({});
  const descriptionClassName = settingsTextFieldStyles.description({});
  const inputClassName = settingsTextFieldStyles.input({ state });
  const errorClassName = settingsTextFieldStyles.error({});

  const handleFocus = (e: Parameters<NonNullable<typeof onFocus>>[0]) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<typeof onBlur>>[0]) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View className={containerClassName} style={style}>
      <View className={labelRowClassName}>
        <Text
          className={labelClassName}
          style={[typography.uiLabel, { color: colors.foreground }]}
        >
          {label}
          {required && (
            <Text
              className={requiredClassName}
              style={{ color: colors.destructive }}
            >
              {" "}
              *
            </Text>
          )}
        </Text>
      </View>
      {description && (
        <Text
          className={descriptionClassName}
          style={[typography.meta, { color: colors.mutedForeground }]}
        >
          {description}
        </Text>
      )}
      <TextInput
        className={inputClassName}
        style={[
          typography.uiLabel,
          {
            color: colors.foreground,
            backgroundColor: colors.muted,
            borderColor:
              state === "error"
                ? colors.destructive
                : state === "focused"
                  ? colors.primary
                  : colors.border,
          },
        ]}
        placeholderTextColor={colors.mutedForeground}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...inputProps}
      />
      {error && (
        <Text
          className={errorClassName}
          style={[typography.micro, { color: colors.destructive }]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

SettingsTextField.displayName = DISPLAY_NAME;

export type { SettingsTextFieldProps };
