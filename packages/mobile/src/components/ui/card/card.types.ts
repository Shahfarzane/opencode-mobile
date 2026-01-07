import type { ViewProps, ViewStyle } from "react-native";

/**
 * Card variant options
 */
export type CardVariant = "default" | "elevated" | "outlined";

/**
 * Card padding options
 */
export type CardPadding = "none" | "sm" | "md" | "lg";

/**
 * Props for the Card component
 */
export interface CardProps extends ViewProps {
  /** Card variant style */
  variant?: CardVariant;
  /** Card padding */
  padding?: CardPadding;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Props for the Card.Header component
 */
export interface CardHeaderProps extends ViewProps {
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Props for the Card.Content component
 */
export interface CardContentProps extends ViewProps {
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Props for the Card.Footer component
 */
export interface CardFooterProps extends ViewProps {
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}
