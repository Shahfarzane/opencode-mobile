import { forwardRef } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-primary active:opacity-80",
  secondary: "bg-secondary active:opacity-80",
  outline: "border border-border bg-transparent active:bg-muted",
  ghost: "bg-transparent active:bg-muted",
  destructive: "bg-destructive active:opacity-80",
};

const variantTextStyles: Record<ButtonVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-destructive-foreground",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3 rounded-lg",
  md: "h-11 px-4 rounded-xl",
  lg: "h-14 px-6 rounded-2xl",
};

const sizeTextStyles: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export const Button = forwardRef<typeof Pressable, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      loading = false,
      disabled,
      children,
      onPress,
      style,
      ...props
    },
    ref
  ) => {
    const handlePress = async (event: Parameters<NonNullable<PressableProps["onPress"]>>[0]) => {
      if (loading || disabled) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(event);
    };

    const isDisabled = disabled || loading;

    return (
      <Pressable
        ref={ref as never}
        disabled={isDisabled}
        onPress={handlePress}
        className={`flex-row items-center justify-center ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? "opacity-50" : ""}`}
        style={style}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "default" || variant === "destructive" ? "#FFFCF0" : "#1C1B1A"}
          />
        ) : typeof children === "string" ? (
          <Text
            className={`font-mono font-semibold ${variantTextStyles[variant]} ${sizeTextStyles[size]}`}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);

Button.displayName = "Button";
