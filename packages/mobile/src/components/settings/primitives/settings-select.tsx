import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";
import { settingsSelectStyles } from "./settings-select.styles";
import type { SettingsSelectProps } from "./settings-select.types";

const DISPLAY_NAME = "SettingsSelect";

/**
 * Settings select component with modal dropdown.
 *
 * @example
 * <SettingsSelect
 *   label="Theme"
 *   options={[
 *     { value: 'light', label: 'Light' },
 *     { value: 'dark', label: 'Dark' },
 *     { value: 'system', label: 'System', description: 'Follow system settings' },
 *   ]}
 *   value={theme}
 *   onChange={setTheme}
 * />
 */
export function SettingsSelect({
  label,
  description,
  options,
  value,
  onChange,
  placeholder = "Select...",
  error,
  required = false,
  className,
  style,
}: SettingsSelectProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption?.label ?? placeholder;
  const hasError = !!error;
  const hasValue = !!selectedOption;

  const containerClassName = settingsSelectStyles.container({ className });
  const labelRowClassName = settingsSelectStyles.labelRow({});
  const labelClassName = settingsSelectStyles.label({});
  const requiredClassName = settingsSelectStyles.required({});
  const descriptionClassName = settingsSelectStyles.description({});
  const triggerClassName = settingsSelectStyles.trigger({ hasError });
  const triggerTextClassName = settingsSelectStyles.triggerText({ hasValue });
  const errorClassName = settingsSelectStyles.error({});
  const overlayClassName = settingsSelectStyles.overlay({});
  const dropdownClassName = settingsSelectStyles.dropdown({});
  const dropdownHeaderClassName = settingsSelectStyles.dropdownHeader({});
  const optionsListClassName = settingsSelectStyles.optionsList({});
  const optionContentClassName = settingsSelectStyles.optionContent({});

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
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
      <Pressable
        onPress={() => setIsOpen(true)}
        className={triggerClassName}
        style={{
          backgroundColor: colors.muted,
          borderColor: hasError ? colors.destructive : colors.border,
        }}
      >
        <Text
          className={triggerTextClassName}
          style={[
            typography.uiLabel,
            {
              color: hasValue ? colors.foreground : colors.mutedForeground,
            },
          ]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 9l6 6 6-6"
            stroke={colors.mutedForeground}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      {error && (
        <Text
          className={errorClassName}
          style={[typography.micro, { color: colors.destructive }]}
        >
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className={overlayClassName}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onPress={() => setIsOpen(false)}
        >
          <View
            className={dropdownClassName}
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            <View
              className={dropdownHeaderClassName}
              style={{ borderBottomColor: colors.border }}
            >
              <Text style={[typography.uiLabel, { color: colors.foreground }]}>
                {label}
              </Text>
            </View>
            <ScrollView className={optionsListClassName} bounces={false}>
              {options.map((option) => {
                const isSelected = option.value === value;
                const optionClassName = settingsSelectStyles.option({
                  isSelected,
                });
                const optionLabelClassName = settingsSelectStyles.optionLabel({
                  isSelected,
                });
                const optionDescClassName =
                  settingsSelectStyles.optionDescription({});

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    className={optionClassName}
                    style={({ pressed }) => [
                      pressed && { backgroundColor: colors.muted },
                      isSelected && { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <View className={optionContentClassName}>
                      <Text
                        className={optionLabelClassName}
                        style={[
                          typography.uiLabel,
                          {
                            color: isSelected
                              ? colors.primary
                              : colors.foreground,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text
                          className={optionDescClassName}
                          style={[
                            typography.meta,
                            { color: colors.mutedForeground },
                          ]}
                          numberOfLines={1}
                        >
                          {option.description}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17l-5-5"
                          stroke={colors.primary}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

SettingsSelect.displayName = DISPLAY_NAME;
