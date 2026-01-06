import { useState } from "react";
import {
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { typography, useTheme } from "@/theme";

export interface SelectOption {
	value: string;
	label: string;
	description?: string;
}

interface SettingsSelectProps {
	label: string;
	description?: string;
	options: SelectOption[];
	value: string | undefined;
	onChange: (value: string) => void;
	placeholder?: string;
	error?: string;
	required?: boolean;
}

export function SettingsSelect({
	label,
	description,
	options,
	value,
	onChange,
	placeholder = "Select...",
	error,
	required = false,
}: SettingsSelectProps) {
	const { colors } = useTheme();
	const [isOpen, setIsOpen] = useState(false);

	const selectedOption = options.find((opt) => opt.value === value);
	const displayValue = selectedOption?.label ?? placeholder;

	const borderColor = error ? colors.destructive : colors.border;

	const handleSelect = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);
	};

	return (
		<View style={styles.container}>
			<View style={styles.labelRow}>
				<Text style={[typography.uiLabel, { color: colors.foreground }]}>
					{label}
					{required && (
						<Text style={{ color: colors.destructive }}> *</Text>
					)}
				</Text>
			</View>
			{description && (
				<Text style={[typography.meta, styles.description, { color: colors.mutedForeground }]}>
					{description}
				</Text>
			)}
			<Pressable
				onPress={() => setIsOpen(true)}
				style={[
					styles.trigger,
					{
						backgroundColor: colors.muted,
						borderColor,
					},
				]}
			>
				<Text
					style={[
						typography.uiLabel,
						{
							color: selectedOption ? colors.foreground : colors.mutedForeground,
							flex: 1,
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
				<Text style={[typography.micro, { color: colors.destructive }]}>
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
					style={styles.overlay}
					onPress={() => setIsOpen(false)}
				>
					<View
						style={[
							styles.dropdown,
							{
								backgroundColor: colors.background,
								borderColor: colors.border,
							},
						]}
					>
						<View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>
								{label}
							</Text>
						</View>
						<ScrollView style={styles.optionsList} bounces={false}>
							{options.map((option) => {
								const isSelected = option.value === value;
								return (
									<Pressable
										key={option.value}
										onPress={() => handleSelect(option.value)}
										style={({ pressed }) => [
											styles.option,
											pressed && { backgroundColor: colors.muted },
											isSelected && { backgroundColor: colors.primary + "15" },
										]}
									>
										<View style={styles.optionContent}>
											<Text
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

const styles = StyleSheet.create({
	container: {
		gap: 6,
	},
	labelRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	description: {
		marginTop: -2,
	},
	trigger: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
		borderWidth: 1,
		gap: 8,
	},
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	dropdown: {
		width: "100%",
		maxHeight: 400,
		borderRadius: 12,
		borderWidth: 1,
		overflow: "hidden",
	},
	dropdownHeader: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	optionsList: {
		maxHeight: 350,
	},
	option: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	optionContent: {
		flex: 1,
		gap: 2,
	},
});
