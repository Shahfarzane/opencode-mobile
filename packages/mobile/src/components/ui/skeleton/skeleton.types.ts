import type { DimensionValue, ViewStyle } from "react-native";

/**
 * Skeleton variant options
 */
export type SkeletonVariant = "rectangle" | "circle" | "text";

/**
 * Props for the Skeleton component
 */
export interface SkeletonProps {
  /** Width of the skeleton */
  width?: DimensionValue;
  /** Height of the skeleton */
  height?: DimensionValue;
  /** Border radius (auto-calculated for circle variant) */
  borderRadius?: number;
  /** Skeleton shape variant */
  variant?: SkeletonVariant;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Props for the Skeleton.Avatar component
 */
export interface SkeletonAvatarProps {
  /** Size of the avatar skeleton */
  size?: number;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Props for the Skeleton.Text component
 */
export interface SkeletonTextProps {
  /** Width of the text skeleton */
  width?: DimensionValue;
  /** Number of lines to show */
  lines?: number;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Props for the Skeleton.Card component
 */
export interface SkeletonCardProps {
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}

/**
 * Props for the Skeleton.Message component
 */
export interface SkeletonMessageProps {
  /** Whether this represents a user message (affects alignment) */
  isUser?: boolean;
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: ViewStyle;
}
