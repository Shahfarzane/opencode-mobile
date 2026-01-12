import { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { shimmer as shimmerAnimation } from "@/lib/animations";
import { useTheme } from "@/theme";
import { withOpacity } from "@/utils/colors";
import { skeletonStyles } from "./skeleton.styles";
import type {
  SkeletonAvatarProps,
  SkeletonCardProps,
  SkeletonMessageProps,
  SkeletonProps,
  SkeletonTextProps,
} from "./skeleton.types";
import {
  SKELETON_AVATAR_DISPLAY_NAME,
  SKELETON_CARD_DISPLAY_NAME,
  SKELETON_DISPLAY_NAME,
  SKELETON_MESSAGE_DISPLAY_NAME,
  SKELETON_TEXT_DISPLAY_NAME,
} from "./skeleton.constants";

/**
 * Skeleton component
 *
 * A loading placeholder with shimmer animation.
 *
 * @example
 * <Skeleton width={200} height={20} />
 *
 * @example
 * <Skeleton variant="circle" width={40} height={40} />
 */
function SkeletonRoot({
  width,
  height,
  borderRadius,
  variant = "rectangle",
  className,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = shimmerAnimation(animatedValue);
    animation.start();

    return () => {
      animation.stop();
    };
  }, [animatedValue]);

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "circle":
        return {
          width: width ?? 40,
          height: height ?? 40,
          borderRadius: typeof width === "number" ? width / 2 : 20,
        };
      case "text":
        return {
          width: width ?? "100%",
          height: height ?? 16,
          borderRadius: borderRadius ?? 4,
        };
      case "rectangle":
      default:
        return {
          width: width ?? "100%",
          height: height ?? 20,
          borderRadius: borderRadius ?? 8,
        };
    }
  };

  const baseClassName = skeletonStyles.base({ variant, className });

  const baseTone: ViewStyle = {
    backgroundColor: withOpacity(colors.card, 0.7),
    borderColor: withOpacity(colors.border, 0.25),
    borderWidth: variant === "circle" ? 0 : 1,
  };

  return (
    <Animated.View
      className={baseClassName}
      style={[
        baseTone,
        getVariantStyle(),
        { opacity: animatedValue },
        style,
      ]}
    />
  );
}


SkeletonRoot.displayName = SKELETON_DISPLAY_NAME;

/**
 * Skeleton avatar component
 */
function SkeletonAvatar({ size = 40, className, style }: SkeletonAvatarProps) {
  return (
    <SkeletonRoot
      variant="circle"
      width={size}
      height={size}
      className={className}
      style={style}
    />
  );
}

SkeletonAvatar.displayName = SKELETON_AVATAR_DISPLAY_NAME;

/**
 * Skeleton text component (supports multiple lines)
 */
function SkeletonText({
  width = "100%",
  lines = 1,
  className,
  style,
}: SkeletonTextProps) {
  if (lines === 1) {
    return (
      <SkeletonRoot
        variant="text"
        width={width}
        className={className}
        style={style}
      />
    );
  }

  const containerClassName = skeletonStyles.textContainer({ className });

  return (
    <View className={containerClassName} style={style}>
      {Array.from({ length: lines }).map((_, index, arr) => (
        <SkeletonRoot
          key={`skeleton-${arr.length}-${index}`}
          variant="text"
          width={index === lines - 1 ? "60%" : width}
        />
      ))}
    </View>
  );
}

SkeletonText.displayName = SKELETON_TEXT_DISPLAY_NAME;

/**
 * Skeleton card component (pre-composed card loading state)
 */
function SkeletonCard({ className, style }: SkeletonCardProps) {
  const { colors } = useTheme();
  const containerClassName = skeletonStyles.cardContainer({ className });
  const headerClassName = skeletonStyles.cardHeader({});
  const headerContentClassName = skeletonStyles.cardHeaderContent({});

  return (
    <View
      className={containerClassName}
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <View className={headerClassName}>
        <SkeletonAvatar size={32} />
        <View className={headerContentClassName}>
          <SkeletonRoot variant="text" width={120} height={14} />
          <SkeletonRoot variant="text" width={80} height={12} />
        </View>
      </View>
      <SkeletonText lines={3} />
    </View>
  );
}

SkeletonCard.displayName = SKELETON_CARD_DISPLAY_NAME;

/**
 * Skeleton message component (chat message loading state)
 */
function SkeletonMessage({
  isUser = false,
  className,
  style,
}: SkeletonMessageProps) {
  const { colors } = useTheme();
  const containerClassName = skeletonStyles.messageContainer({ isUser, className });
  const bubbleClassName = skeletonStyles.messageBubble({ isUser });

  return (
    <View className={containerClassName} style={style}>
      <View
        className={bubbleClassName}
        style={{
          backgroundColor: isUser
            ? colors.chatUserMessageBackground
            : colors.muted,
        }}
      >
        <SkeletonText lines={2} />
      </View>
    </View>
  );
}

SkeletonMessage.displayName = SKELETON_MESSAGE_DISPLAY_NAME;

/**
 * Skeleton component with compound components
 */
export const Skeleton = Object.assign(SkeletonRoot, {
  Avatar: SkeletonAvatar,
  Text: SkeletonText,
  Card: SkeletonCard,
  Message: SkeletonMessage,
});

export type {
  SkeletonProps,
  SkeletonAvatarProps,
  SkeletonTextProps,
  SkeletonCardProps,
  SkeletonMessageProps,
};
