import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState } from "react";
import {
	Alert,
	Dimensions,
	Image,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
	type LayoutRectangle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileIcon, ImageIcon, PlusCircleIcon, XIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";

export interface AttachedFile {
	id: string;
	name: string;
	type: string;
	size: number;
	uri: string;
	base64?: string;
}

interface FileAttachmentButtonProps {
	onFileAttached: (file: AttachedFile) => void;
	disabled?: boolean;
}

interface AttachedFilesListProps {
	files: AttachedFile[];
	onRemove: (fileId: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
	return name.split(".").pop()?.toLowerCase() || "";
}

export function FileAttachmentButton({
	onFileAttached,
	disabled = false,
}: FileAttachmentButtonProps) {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [buttonLayout, setButtonLayout] = useState<LayoutRectangle | null>(null);
	const buttonRef = useRef<View>(null);

	const handleImagePick = useCallback(async () => {
		setIsPickerOpen(false);

		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert(
				"Permission Required",
				"Please allow access to your photo library.",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsMultipleSelection: false,
			quality: 0.8,
			base64: true,
		});

		if (result.canceled || !result.assets?.[0]) return;

		const asset = result.assets[0];
		const fileName = asset.fileName || `image_${Date.now()}.jpg`;

		if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
			Alert.alert(
				"File Too Large",
				`Maximum file size is ${formatFileSize(MAX_FILE_SIZE)}`,
			);
			return;
		}

		const attachedFile: AttachedFile = {
			id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
			name: fileName,
			type: asset.mimeType || "image/jpeg",
			size: asset.fileSize || 0,
			uri: asset.uri,
			base64: asset.base64 ?? undefined,
		};

		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onFileAttached(attachedFile);
	}, [onFileAttached]);

	const handleDocumentPick = useCallback(async () => {
		setIsPickerOpen(false);

		const result = await DocumentPicker.getDocumentAsync({
			type: "*/*",
			copyToCacheDirectory: true,
		});

		if (result.canceled || !result.assets?.[0]) return;

		const asset = result.assets[0];

		if (asset.size && asset.size > MAX_FILE_SIZE) {
			Alert.alert(
				"File Too Large",
				`Maximum file size is ${formatFileSize(MAX_FILE_SIZE)}`,
			);
			return;
		}

		const attachedFile: AttachedFile = {
			id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
			name: asset.name,
			type: asset.mimeType || "application/octet-stream",
			size: asset.size || 0,
			uri: asset.uri,
		};

		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		onFileAttached(attachedFile);
	}, [onFileAttached]);

	const showOptions = useCallback(async () => {
		if (disabled) return;
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		// Measure button position for menu placement
		buttonRef.current?.measureInWindow((x, y, width, height) => {
			setButtonLayout({ x, y, width, height });
			setIsPickerOpen(true);
		});
	}, [disabled]);

	return (
		<>
			<View ref={buttonRef} collapsable={false}>
				<Pressable
					onPress={showOptions}
					disabled={disabled}
					style={[styles.attachButton, { opacity: disabled ? 0.5 : 1 }]}
					hitSlop={8}
				>
					<PlusCircleIcon size={20} color={colors.mutedForeground} />
				</Pressable>
			</View>

			<Modal
				visible={isPickerOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setIsPickerOpen(false)}
			>
				<Pressable
					style={styles.modalBackdrop}
					onPress={() => setIsPickerOpen(false)}
				>
					<View
						style={[
							styles.optionsMenu,
							{
								backgroundColor: colors.card,
								borderColor: colors.border,
								// Position menu above the button
								position: "absolute",
								left: Math.max(buttonLayout?.x ?? 16, 16),
								// Always position above the button with proper offset
								bottom: buttonLayout
									? Dimensions.get("window").height - buttonLayout.y + 8
									: insets.bottom + 80,
							},
						]}
					>
						<Pressable
							onPress={handleImagePick}
							style={[styles.optionItem, { borderBottomColor: colors.border }]}
						>
							<ImageIcon size={20} color={colors.foreground} />
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>
								Photo Library
							</Text>
						</Pressable>
						<Pressable onPress={handleDocumentPick} style={styles.optionItem}>
							<FileIcon size={20} color={colors.foreground} />
							<Text style={[typography.uiLabel, { color: colors.foreground }]}>
								Files
							</Text>
						</Pressable>
					</View>
				</Pressable>
			</Modal>
		</>
	);
}

export function AttachedFilesList({ files, onRemove }: AttachedFilesListProps) {
	const { colors } = useTheme();

	if (files.length === 0) return null;

	return (
		<View style={styles.filesList}>
			{files.map((file) => {
				const isImage = file.type.startsWith("image/");
				const extension = getFileExtension(file.name);

				return (
					<View
						key={file.id}
						style={[
							styles.fileChip,
							{
								backgroundColor: colors.muted,
								borderColor: colors.border,
							},
						]}
					>
						{isImage && file.uri ? (
							<Image source={{ uri: file.uri }} style={styles.fileThumbnail} />
						) : (
							<View
								style={[
									styles.fileIconWrapper,
									{ backgroundColor: colors.card },
								]}
							>
								<Text
									style={[typography.micro, { color: colors.mutedForeground }]}
								>
									{extension.toUpperCase().slice(0, 3)}
								</Text>
							</View>
						)}

						<View style={styles.fileInfo}>
							<Text
								style={[typography.micro, { color: colors.foreground }]}
								numberOfLines={1}
							>
								{file.name}
							</Text>
							<Text
								style={[typography.micro, { color: colors.mutedForeground }]}
							>
								{formatFileSize(file.size)}
							</Text>
						</View>

						<Pressable
							onPress={() => onRemove(file.id)}
							style={styles.removeButton}
							hitSlop={8}
						>
							<XIcon size={14} color={colors.mutedForeground} />
						</Pressable>
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	attachButton: {
		padding: 6,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.3)",
	},
	optionsMenu: {
		borderRadius: 8,
		borderWidth: 1,
		overflow: "hidden",
		minWidth: 160,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 8,
	},
	optionItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	filesList: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 8,
	},
	fileChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 4,
		paddingRight: 8,
		paddingVertical: 4,
		borderRadius: 8,
		borderWidth: 1,
	},
	fileThumbnail: {
		width: 32,
		height: 32,
		borderRadius: 4,
	},
	fileIconWrapper: {
		width: 32,
		height: 32,
		borderRadius: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	fileInfo: {
		maxWidth: 100,
	},
	removeButton: {
		padding: 4,
	},
});
