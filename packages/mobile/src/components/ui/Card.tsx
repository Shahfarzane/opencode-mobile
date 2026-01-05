import { StyleSheet, View, type ViewProps, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";

interface CardProps extends ViewProps {
	variant?: "default" | "elevated" | "outlined";
	padding?: "none" | "sm" | "md" | "lg";
}

const paddingValues: Record<NonNullable<CardProps["padding"]>, number> = {
	none: 0,
	sm: 12,
	md: 24,   // Match desktop p-6 (was 16)
	lg: 32,
};

export function Card({
	variant = "default",
	padding = "md",
	style,
	children,
	...props
}: CardProps) {
	const { colors } = useTheme();

	const getVariantStyle = (): ViewStyle => {
		switch (variant) {
			case "elevated":
				return {
					backgroundColor: colors.card,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.1,
					shadowRadius: 2,
					elevation: 2,
				};
			case "outlined":
				return {
					backgroundColor: colors.card,
					borderWidth: 1,
					borderColor: colors.border,
				};
			default:
				return {
					backgroundColor: colors.card,
				};
		}
	};

	return (
		<View
			style={[
				styles.card,
				getVariantStyle(),
				{ padding: paddingValues[padding] },
				style,
			]}
			{...props}
		>
			{children}
		</View>
	);
}

interface CardHeaderProps extends ViewProps {
	style?: ViewStyle;
}

export function CardHeader({ style, children, ...props }: CardHeaderProps) {
	return (
		<View style={[styles.header, style]} {...props}>
			{children}
		</View>
	);
}

interface CardContentProps extends ViewProps {
	style?: ViewStyle;
}

export function CardContent({ style, children, ...props }: CardContentProps) {
	return (
		<View style={style} {...props}>
			{children}
		</View>
	);
}

interface CardFooterProps extends ViewProps {
	style?: ViewStyle;
}

export function CardFooter({ style, children, ...props }: CardFooterProps) {
	return (
		<View style={[styles.footer, style]} {...props}>
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: 12,  // Match desktop rounded-xl (was 16)
		gap: 24,           // Match desktop gap-6 between sections
	},
	header: {
		gap: 6,            // Match desktop gap-1.5
	},
	footer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,            // Match desktop gap-2
	},
});
