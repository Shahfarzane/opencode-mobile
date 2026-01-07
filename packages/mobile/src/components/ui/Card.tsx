import { View, type ViewProps, type ViewStyle } from "react-native";

interface CardProps extends ViewProps {
	variant?: "default" | "elevated" | "outlined";
	padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
	none: "p-0",
	sm: "p-3",
	md: "p-6",
	lg: "p-8",
};

const variantClasses: Record<NonNullable<CardProps["variant"]>, string> = {
	default: "bg-card",
	elevated: "bg-card shadow-sm",
	outlined: "bg-card border border-border",
};

export function Card({
	variant = "default",
	padding = "md",
	style,
	children,
	className,
	...props
}: CardProps & { className?: string }) {
	return (
		<View
			className={`rounded-xl gap-6 ${variantClasses[variant]} ${paddingClasses[padding]} ${className ?? ""}`}
			style={style}
			{...props}
		>
			{children}
		</View>
	);
}

interface CardHeaderProps extends ViewProps {
	style?: ViewStyle;
}

export function CardHeader({
	style,
	children,
	className,
	...props
}: CardHeaderProps & { className?: string }) {
	return (
		<View className={`gap-1.5 ${className ?? ""}`} style={style} {...props}>
			{children}
		</View>
	);
}

interface CardContentProps extends ViewProps {
	style?: ViewStyle;
}

export function CardContent({
	style,
	children,
	className,
	...props
}: CardContentProps & { className?: string }) {
	return (
		<View className={className} style={style} {...props}>
			{children}
		</View>
	);
}

interface CardFooterProps extends ViewProps {
	style?: ViewStyle;
}

export function CardFooter({
	style,
	children,
	className,
	...props
}: CardFooterProps & { className?: string }) {
	return (
		<View
			className={`flex-row items-center gap-2 ${className ?? ""}`}
			style={style}
			{...props}
		>
			{children}
		</View>
	);
}
