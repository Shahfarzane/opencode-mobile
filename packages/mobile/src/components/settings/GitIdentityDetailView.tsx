import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { type GitIdentityProfile, gitApi } from "@/api";
import { CheckIcon, ChevronLeft } from "@/components/icons";
import { Spacing, typography, useTheme } from "@/theme";

interface GitIdentityDetailViewProps {
	profileId: string;
	onBack: () => void;
	onDeleted?: () => void;
}

const COLORS = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#14b8a6",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
];

export function GitIdentityDetailView({
	profileId,
	onBack,
	onDeleted,
}: GitIdentityDetailViewProps) {
	const { colors } = useTheme();
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const [name, setName] = useState("");
	const [userName, setUserName] = useState("");
	const [userEmail, setUserEmail] = useState("");
	const [sshKey, setSshKey] = useState("");
	const [color, setColor] = useState<string | null>(null);

	const isNewProfile = profileId === "__new__";

	const loadProfile = useCallback(async () => {
		setIsLoading(true);
		try {
			if (!isNewProfile) {
				const profiles = await gitApi.getIdentities();
				const foundProfile = profiles.find((p) => p.id === profileId);
				if (foundProfile) {
					setName(foundProfile.name);
					setUserName(foundProfile.userName);
					setUserEmail(foundProfile.userEmail);
					setSshKey(foundProfile.sshKey ?? "");
					setColor(foundProfile.color ?? null);
				}
			}
		} catch (error) {
			console.error("Failed to load git identity:", error);
			Alert.alert("Error", "Failed to load git identity details");
		} finally {
			setIsLoading(false);
		}
	}, [profileId, isNewProfile]);

	useEffect(() => {
		loadProfile();
	}, [loadProfile]);

	const handleSave = async () => {
		if (!name.trim()) {
			Alert.alert("Error", "Profile name is required");
			return;
		}
		if (!userName.trim()) {
			Alert.alert("Error", "Git user name is required");
			return;
		}
		if (!userEmail.trim()) {
			Alert.alert("Error", "Git email is required");
			return;
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setIsSaving(true);
		try {
			const profileData: GitIdentityProfile = {
				id: isNewProfile ? `profile-${Date.now()}` : profileId,
				name: name.trim(),
				userName: userName.trim(),
				userEmail: userEmail.trim(),
				sshKey: sshKey.trim() || null,
				color: color,
			};

			if (isNewProfile) {
				await gitApi.createIdentity(profileData);
			} else {
				await gitApi.updateIdentity(profileId, profileData);
			}
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			onBack();
		} catch (error) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to save git identity",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		Alert.alert(
			"Delete Git Identity",
			`Are you sure you want to delete "${name}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setIsSaving(true);
						try {
							await gitApi.deleteIdentity(profileId);
							Haptics.notificationAsync(
								Haptics.NotificationFeedbackType.Success,
							);
							onDeleted?.();
							onBack();
						} catch (error) {
							Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
							Alert.alert(
								"Error",
								error instanceof Error ? error.message : "Failed to delete",
							);
						} finally {
							setIsSaving(false);
						}
					},
				},
			],
		);
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="small" color={colors.primary} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
					<ChevronLeft size={18} color={colors.foreground} />
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, fontWeight: "600" },
						]}
					>
						{isNewProfile ? "New Identity" : name || "Git Identity"}
					</Text>
				</Pressable>
				<Pressable
					onPress={handleSave}
					disabled={isSaving}
					style={[
						styles.saveBtn,
						{ backgroundColor: colors.primary, opacity: isSaving ? 0.6 : 1 },
					]}
				>
					{isSaving ? (
						<ActivityIndicator size="small" color={colors.primaryForeground} />
					) : (
						<Text
							style={[
								typography.meta,
								{ color: colors.primaryForeground, fontWeight: "500" },
							]}
						>
							Save
						</Text>
					)}
				</Pressable>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				{/* Profile Name */}
				<View style={styles.field}>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, fontWeight: "600" },
						]}
					>
						Profile name
					</Text>
					<TextInput
						style={[
							typography.uiLabel,
							styles.input,
							{ color: colors.foreground, borderColor: colors.border },
						]}
						value={name}
						onChangeText={setName}
						placeholder="Work, Personal, etc."
						placeholderTextColor={colors.mutedForeground}
					/>
				</View>

				{/* Color */}
				<View style={styles.field}>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, fontWeight: "600", marginBottom: 8 },
						]}
					>
						Color
					</Text>
					<View style={styles.colorRow}>
						{COLORS.map((c) => (
							<Pressable
								key={c}
								onPress={() => setColor(c === color ? null : c)}
								style={[styles.colorDot, { backgroundColor: c }]}
							>
								{color === c && <CheckIcon size={14} color="#fff" />}
							</Pressable>
						))}
					</View>
				</View>

				{/* Git Config */}
				<View
					style={[styles.section, { borderTopColor: colors.border + "66" }]}
				>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, fontWeight: "600", marginBottom: 12 },
						]}
					>
						Git configuration
					</Text>

					<View style={styles.field}>
						<Text style={[typography.meta, { color: colors.mutedForeground }]}>
							User name
						</Text>
						<TextInput
							style={[
								typography.uiLabel,
								styles.input,
								{ color: colors.foreground, borderColor: colors.border },
							]}
							value={userName}
							onChangeText={setUserName}
							placeholder="John Doe"
							placeholderTextColor={colors.mutedForeground}
							autoCapitalize="words"
						/>
					</View>

					<View style={styles.field}>
						<Text style={[typography.meta, { color: colors.mutedForeground }]}>
							Email
						</Text>
						<TextInput
							style={[
								typography.uiLabel,
								styles.input,
								{ color: colors.foreground, borderColor: colors.border },
							]}
							value={userEmail}
							onChangeText={setUserEmail}
							placeholder="john@example.com"
							placeholderTextColor={colors.mutedForeground}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
						/>
					</View>
				</View>

				{/* SSH Key */}
				<View
					style={[styles.section, { borderTopColor: colors.border + "66" }]}
				>
					<Text
						style={[
							typography.uiLabel,
							{ color: colors.foreground, fontWeight: "600", marginBottom: 4 },
						]}
					>
						SSH key path
					</Text>
					<Text
						style={[
							typography.micro,
							{ color: colors.mutedForeground, marginBottom: 8 },
						]}
					>
						Optional path to SSH key for this identity
					</Text>
					<TextInput
						style={[
							typography.uiLabel,
							styles.input,
							{ color: colors.foreground, borderColor: colors.border },
						]}
						value={sshKey}
						onChangeText={setSshKey}
						placeholder="~/.ssh/id_ed25519"
						placeholderTextColor={colors.mutedForeground}
						autoCapitalize="none"
						autoCorrect={false}
					/>
				</View>

				{/* Delete */}
				{!isNewProfile && (
					<View
						style={[styles.section, { borderTopColor: colors.border + "66" }]}
					>
						<Pressable onPress={handleDelete}>
							<Text style={[typography.meta, { color: colors.destructive }]}>
								Delete identity
							</Text>
						</Pressable>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centered: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing[4],
		paddingVertical: Spacing[2],
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	saveBtn: {
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 6,
		minWidth: 50,
		alignItems: "center",
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingHorizontal: Spacing[4],
		paddingBottom: Spacing[8],
		gap: Spacing[4],
	},
	field: {
		gap: 6,
	},
	input: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderWidth: 1,
		borderRadius: 6,
	},
	section: {
		paddingTop: Spacing[4],
		borderTopWidth: 1,
	},
	colorRow: {
		flexDirection: "row",
		gap: 10,
	},
	colorDot: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
});
