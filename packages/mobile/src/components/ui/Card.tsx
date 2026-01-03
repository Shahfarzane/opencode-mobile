import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-card",
  elevated: "bg-card shadow-sm",
  outlined: "bg-card border border-border",
};

const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <View
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps extends ViewProps {
  className?: string;
}

export function CardHeader({ className = "", children, ...props }: CardHeaderProps) {
  return (
    <View className={`pb-3 ${className}`} {...props}>
      {children}
    </View>
  );
}

interface CardContentProps extends ViewProps {
  className?: string;
}

export function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <View className={className} {...props}>
      {children}
    </View>
  );
}

interface CardFooterProps extends ViewProps {
  className?: string;
}

export function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  return (
    <View className={`pt-3 ${className}`} {...props}>
      {children}
    </View>
  );
}
