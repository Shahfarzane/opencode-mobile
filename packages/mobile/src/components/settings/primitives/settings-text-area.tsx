import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { typography, useTheme } from "@/theme";
import { settingsTextAreaStyles } from "./settings-text-area.styles";
import type { SettingsTextAreaProps } from "./settings-text-area.types";

const DISPLAY_NAME = "SettingsTextArea";

/**
 * Settings text area component for multi-line input.
 *
 * @example
 * <SettingsTextArea
 *   label="Description"
 *   description="Enter a detailed description"
 *   value={description}
 *   onChangeText={setDescription}
 *   rows={6}
 * />
 */
export function SettingsTextArea({
  label,
  description,
  error,
  required = false,
  rows = 4,
  className,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: SettingsTextAreaProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const state = error ? "error" : isFocused ? "focused" : "default";
  const minHeight = rows * 22 + 20;

  const containerClassName = settingsTextAreaStyles.container({ className });
  const labelRowClassName = settingsTextAreaStyles.labelRow({});
  const labelClassName = settingsTextAreaStyles.label({});
  const requiredClassName = settingsTextAreaStyles.required({});
  const descriptionClassName = settingsTextAreaStyles.description({});
  const inputClassName = settingsTextAreaStyles.input({ state });
  const errorClassName = settingsTextAreaStyles.error({});

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
            minHeight,
          },
        ]}
        placeholderTextColor={colors.mutedForeground}
        multiline
        textAlignVertical="top"
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

SettingsTextArea.displayName = DISPLAY_NAME;

export type { SettingsTextAreaProps };
