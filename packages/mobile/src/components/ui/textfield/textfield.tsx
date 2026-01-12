import { createContext, forwardRef, useContext, useState } from "react";
import { Text, TextInput, View, type ViewStyle } from "react-native";
import { FocusRingTokens, MobileSizes, SemanticSpacing, typography, useTheme } from "@/theme";
import { withOpacity } from "@/utils/colors";
import { textFieldStyles } from "./textfield.styles";
import type {
  TextFieldContextValue,
  TextFieldProps,
  TextFieldSize,
  TextFieldState,
  TextFieldVariant,
} from "./textfield.types";

/**
 * TextField context for compound components
 */
const TextFieldContext = createContext<TextFieldContextValue | null>(null);

function useTextFieldContext(): TextFieldContextValue | null {
  return useContext(TextFieldContext);
}

/**
 * TextField component
 *
 * A multiline text input matching the PWA's Textarea component.
 * Supports auto-growing height, labels, error states, and focus rings.
 *
 * @example
 * // Basic usage
 * <TextField
 *   placeholder="Enter your message..."
 *   multiline
 * />
 *
 * @example
 * // With label and error
 * <TextField
 *   label="Description"
 *   placeholder="Describe your issue"
 *   error="This field is required"
 *   multiline
 * />
 */
const TextFieldRoot = forwardRef<TextInput, TextFieldProps>(
  (
    {
      size = "md",
      variant = "default",
      error,
      label,
      helperText,
      className,
      inputClassName,
      containerStyle,
      inputStyle,
      editable = true,
      multiline = true,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const hasError = !!error;
    const isDisabled = !editable;

    // Determine state
    const getState = (): TextFieldState => {
      if (isDisabled) return "disabled";
      if (hasError) return "error";
      if (isFocused) return "focused";
      return "default";
    };

    const state = getState();

    const containerTone: ViewStyle = {
      backgroundColor: withOpacity(colors.card, state === "focused" ? 0.94 : 0.86),
      borderColor: hasError ? colors.destructive : state === "focused" ? colors.primary : colors.border,
      shadowColor: withOpacity(colors.foreground, 0.08),
      shadowOffset: { width: 0, height: state === "focused" ? 12 : 6 },
      shadowOpacity: state === "focused" ? 0.22 : 0.12,
      shadowRadius: state === "focused" ? 18 : 10,
      elevation: 4,
    };

    const contextValue: TextFieldContextValue = {
      size,
      variant,
      state,
      hasError,
    };

    const containerClassName = textFieldStyles.container({ state, variant, size, className });
    const inputClassName_ = textFieldStyles.input({ size, variant, className: inputClassName });

    const sizeHeights = {
      sm: MobileSizes.inputSm,
      md: MobileSizes.inputMd,
      lg: MobileSizes.inputLg,
    } as const;

    const paddingY = MobileSizes.inputPaddingY;
    const paddingX = MobileSizes.inputPaddingX;
    const minHeight = sizeHeights[size];

    const handleFocus = (e: Parameters<NonNullable<typeof onFocus>>[0]) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: Parameters<NonNullable<typeof onBlur>>[0]) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // Focus ring styling matching PWA: focus-visible:ring-ring/50 focus-visible:ring-[3px]
    const focusRingStyle: ViewStyle = isFocused && !isDisabled && !hasError
      ? {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: FocusRingTokens.opacity,
          shadowRadius: FocusRingTokens.width,
        }
      : {};

    return (
      <TextFieldContext.Provider value={contextValue}>
        <View className="w-full">
          {label && (
            <TextFieldLabel size={size}>{label}</TextFieldLabel>
          )}

          <View
            className={containerClassName}
            style={[focusRingStyle, containerTone, containerStyle, { minHeight }]}
          >
            <TextInput
              ref={ref}
              editable={editable}
              multiline={multiline}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholderTextColor={colors.mutedForeground}
              className={inputClassName_}
              style={[
                typography.body,
                {
                  color: colors.foreground,
                  textAlignVertical: multiline ? "top" : "center",
                  paddingHorizontal: paddingX,
                  paddingVertical: paddingY,
                  minHeight,
                },
                inputStyle,
              ]}
              {...props}
            />
          </View>

          {(error || helperText) && (
            <TextFieldHelperText isError={hasError} size={size}>
              {typeof error === "string" ? error : helperText}
            </TextFieldHelperText>
          )}
        </View>
      </TextFieldContext.Provider>
    );
  }
);

TextFieldRoot.displayName = "TextField";

/**
 * TextField label component
 */
interface TextFieldLabelProps {
  children: React.ReactNode;
  size?: TextFieldSize;
  className?: string;
}

function TextFieldLabel({ children, size: sizeProp, className }: TextFieldLabelProps) {
  const context = useTextFieldContext();
  const { colors } = useTheme();

  const size = sizeProp ?? context?.size ?? "md";
  const labelClassName = textFieldStyles.label({ size, className });

  return (
    <Text
      className={labelClassName}
      style={[
        typography.uiLabel,
        { color: colors.foreground, marginBottom: SemanticSpacing.gapSm },
      ]}
    >
      {children}
    </Text>
  );
}

TextFieldLabel.displayName = "TextFieldLabel";

/**
 * TextField helper text component
 */
interface TextFieldHelperTextProps {
  children: React.ReactNode;
  isError?: boolean;
  size?: TextFieldSize;
  className?: string;
}

function TextFieldHelperText({
  children,
  isError = false,
  size: sizeProp,
  className,
}: TextFieldHelperTextProps) {
  const context = useTextFieldContext();
  const { colors } = useTheme();

  const size = sizeProp ?? context?.size ?? "md";
  const helperClassName = textFieldStyles.helperText({ isError, size, className });

  return (
    <Text
      className={helperClassName}
      style={[
        typography.micro,
        {
          color: isError ? colors.destructive : colors.mutedForeground,
          marginTop: SemanticSpacing.gapXs,
        },
      ]}
    >
      {children}
    </Text>
  );
}

TextFieldHelperText.displayName = "TextFieldHelperText";

/**
 * TextField component with compound components
 */
export const TextField = Object.assign(TextFieldRoot, {
  Label: TextFieldLabel,
  HelperText: TextFieldHelperText,
});

export type { TextFieldProps, TextFieldSize, TextFieldVariant, TextFieldState };
