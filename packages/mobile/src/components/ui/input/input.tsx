import { createContext, forwardRef, useContext, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { typography, useTheme } from "@/theme";
import { inputStyles } from "./input.styles";
import type {
  InputContextValue,
  InputHelperTextProps,
  InputLabelProps,
  InputProps,
  InputSize,
  InputState,
} from "./input.types";
import {
  INPUT_DISPLAY_NAME,
  INPUT_HELPER_TEXT_DISPLAY_NAME,
  INPUT_LABEL_DISPLAY_NAME,
} from "./input.constants";

/**
 * Input context for compound components
 */
const InputContext = createContext<InputContextValue | null>(null);

function useInputContext(): InputContextValue | null {
  return useContext(InputContext);
}

/**
 * Input component
 *
 * A text input with label, error, and helper text support.
 *
 * @example
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 * />
 *
 * @example
 * // With icons
 * <Input
 *   leftIcon={<SearchIcon />}
 *   placeholder="Search..."
 * />
 */
const InputRoot = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = "md",
      prefix,
      leftIcon,
      rightIcon,
      editable = true,
      className,
      inputClassName,
      style,
      inputStyle,
      onFocus,
      onBlur,
      multiline,
      numberOfLines,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const hasError = !!error;
    const isDisabled = !editable;

    // Determine input state
    const getState = (): InputState => {
      if (isDisabled) return "disabled";
      if (hasError) return "error";
      if (isFocused) return "focused";
      return "default";
    };

    const state = getState();

    const contextValue: InputContextValue = {
      size,
      state,
      hasError,
    };

    const wrapperClassName = inputStyles.wrapper({ className });
    const containerClassName = inputStyles.container({ state, size, multiline });
    const prefixClassName = inputStyles.prefix({ size });
    const inputClassName_ = inputStyles.input({
      size,
      hasLeftIcon: !!leftIcon || !!prefix,
      hasRightIcon: !!rightIcon,
      multiline,
      className: inputClassName,
    });

    const handleFocus = (e: Parameters<NonNullable<typeof onFocus>>[0]) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: Parameters<NonNullable<typeof onBlur>>[0]) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // Calculate min height for multiline based on numberOfLines
    // Using line height of ~20px (body text) + padding
    const multilineStyle = multiline
      ? {
          textAlignVertical: "top" as const,
          minHeight: numberOfLines ? numberOfLines * 20 + 24 : 100,
        }
      : undefined;

    return (
      <InputContext.Provider value={contextValue}>
        <View className={wrapperClassName} style={style}>
          {label && (
            <InputLabel size={size}>{label}</InputLabel>
          )}

          <View className={containerClassName}>
            {prefix && (
              <View className={prefixClassName}>
                <Text style={[typography.uiLabel, { color: colors.mutedForeground }]}>
                  {prefix}
                </Text>
              </View>
            )}

            {leftIcon && !prefix && (
              <View className={inputStyles.iconWrapper({ position: "left" })}>
                {leftIcon}
              </View>
            )}

            <TextInput
              ref={ref}
              editable={editable}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholderTextColor={colors.mutedForeground}
              className={inputClassName_}
              style={[
                typography.body,
                { color: colors.foreground },
                multilineStyle,
                inputStyle,
              ]}
              multiline={multiline}
              numberOfLines={numberOfLines}
              {...props}
            />

            {rightIcon && (
              <View className={inputStyles.iconWrapper({ position: "right" })}>
                {rightIcon}
              </View>
            )}
          </View>

          {(error || helperText) && (
            <InputHelperText isError={hasError} size={size}>
              {error || helperText}
            </InputHelperText>
          )}
        </View>
      </InputContext.Provider>
    );
  }
);

InputRoot.displayName = INPUT_DISPLAY_NAME;

/**
 * Input label component
 */
function InputLabel({
  className,
  style,
  children,
  size: sizeProp,
}: InputLabelProps & { size?: InputSize }) {
  const context = useInputContext();
  const { colors } = useTheme();

  const size = sizeProp ?? context?.size ?? "md";
  const labelClassName = inputStyles.label({ size, className });

  return (
    <Text
      className={labelClassName}
      style={[typography.uiLabel, { color: colors.foreground }, style]}
    >
      {children}
    </Text>
  );
}

InputLabel.displayName = INPUT_LABEL_DISPLAY_NAME;

/**
 * Input helper text component
 */
function InputHelperText({
  isError = false,
  className,
  style,
  children,
  size: sizeProp,
}: InputHelperTextProps & { size?: InputSize }) {
  const context = useInputContext();
  const { colors } = useTheme();

  const size = sizeProp ?? context?.size ?? "md";
  const helperClassName = inputStyles.helperText({ isError, size, className });

  return (
    <Text
      className={helperClassName}
      style={[
        typography.micro,
        { color: isError ? colors.destructive : colors.mutedForeground },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

InputHelperText.displayName = INPUT_HELPER_TEXT_DISPLAY_NAME;

/**
 * Input component with compound components
 */
export const Input = Object.assign(InputRoot, {
  Label: InputLabel,
  HelperText: InputHelperText,
});

export type { InputProps, InputLabelProps, InputHelperTextProps, InputSize, InputState };
