import type BottomSheet from "@gorhom/bottom-sheet";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
	FileIcon,
	FolderIcon,
	ImageIcon,
	PlusCircleIcon,
	XIcon,
} from "@/components/icons";
import { IconButton } from "@/components/ui";
import { Sheet } from "@/components/ui/sheet";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { typography, useTheme } from "@/theme";
import { ServerFilePicker } from "./ServerFilePicker";

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
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [isServerPickerOpen, setIsServerPickerOpen] = useState(false);
	const sheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["32%"], []);
	const directory = useConnectionStore((state) => state.directory);

	// Track if we need to open the sheet after it mounts
	const shouldOpenRef = useRef(false);

	// Use callback ref to open sheet when it mounts
	const handleSheetRef = useCallback((sheet: BottomSheet | null) => {
		sheetRef.current = sheet;
		if (sheet && shouldOpenRef.current) {
			// Small delay to ensure sheet is fully mounted
			requestAnimationFrame(() => {
				sheet.snapToIndex(0);
				shouldOpenRef.current = false;
			});
		}
	}, []);

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

	const handleServerFilesSelected = useCallback(
		async (files: Array<{ name: string; path: string }>) => {
			for (const file of files) {
				const attachedFile: AttachedFile = {
					id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
					name: file.name,
					type: "text/plain", // Server files are typically text
					size: 0,
					uri: file.path,
				};
				onFileAttached(attachedFile);
			}
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		},
		[onFileAttached],
	);

	const handleOpenServerPicker = useCallback(() => {
		setIsPickerOpen(false);
		setIsServerPickerOpen(true);
	}, []);

	const showOptions = useCallback(async () => {
		if (disabled) return;
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		shouldOpenRef.current = true;
		setIsPickerOpen(true);
	}, [disabled]);

	return (
		<>
			<IconButton
				icon={<PlusCircleIcon size={20} color={colors.foreground} />}
				variant="ghost"
				size="icon-md"
				onPress={showOptions}
				isDisabled={disabled}
				accessibilityLabel="Attach file"
			/>

			{isPickerOpen && (
				<Sheet
					ref={handleSheetRef}
					snapPoints={snapPoints}
					onClose={() => setIsPickerOpen(false)}
					contentPadding={0}
					enablePanDownToClose={true}
				>
					<View className="pb-2">
					<View className="px-4 pt-2 pb-1">
						<Text style={[typography.uiHeader, { color: colors.foreground }]}>
							Attach file
						</Text>
					</View>
					<View
						className="border-t"
						style={{ borderTopColor: colors.border }}
					/>
					<TouchableOpacity
						onPress={handleImagePick}
						activeOpacity={0.7}
						className="flex-row items-center gap-3 px-4 py-3"
					>
						<ImageIcon size={20} color={colors.foreground} />
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Photo Library
						</Text>
					</TouchableOpacity>
					<View className="h-px" style={{ backgroundColor: colors.border }} />
					<TouchableOpacity
						onPress={handleDocumentPick}
						activeOpacity={0.7}
						className="flex-row items-center gap-3 px-4 py-3"
					>
						<FileIcon size={20} color={colors.foreground} />
						<Text style={[typography.uiLabel, { color: colors.foreground }]}>
							Files
						</Text>
					</TouchableOpacity>
					{directory && (
						<>
							<View
								className="h-px"
								style={{ backgroundColor: colors.border }}
							/>
							<TouchableOpacity
								onPress={handleOpenServerPicker}
								activeOpacity={0.7}
								className="flex-row items-center gap-3 px-4 py-3"
							>
								<FolderIcon size={20} color={colors.foreground} />
								<Text
									style={[typography.uiLabel, { color: colors.foreground }]}
								>
									Project Files
								</Text>
							</TouchableOpacity>
						</>
					)}
					</View>
				</Sheet>
			)}

			{directory && (
				<ServerFilePicker
					visible={isServerPickerOpen}
					onClose={() => setIsServerPickerOpen(false)}
					onFilesSelected={handleServerFilesSelected}
					rootDirectory={directory}
					multiSelect
				/>
			)}
		</>
	);
}

export function AttachedFilesList({ files, onRemove }: AttachedFilesListProps) {
	const { colors } = useTheme();

	if (files.length === 0) return null;

	return (
		<View className="flex-row flex-wrap gap-2 mb-2">
			{files.map((file) => {
				const isImage = file.type.startsWith("image/");
				const extension = getFileExtension(file.name);

				return (
					<View
						key={file.id}
						className="flex-row items-center gap-2 pl-1 pr-2 py-1 rounded-lg border"
						style={{
							backgroundColor: colors.muted,
							borderColor: colors.border,
						}}
					>
						{isImage && file.uri ? (
							<Image source={{ uri: file.uri }} className="w-8 h-8 rounded" />
						) : (
							<View
								className="w-8 h-8 rounded items-center justify-center"
								style={{ backgroundColor: colors.card }}
							>
								<Text
									style={[typography.micro, { color: colors.mutedForeground }]}
								>
									{extension.toUpperCase().slice(0, 3)}
								</Text>
							</View>
						)}

						<View className="max-w-[100px]">
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

						<IconButton
							icon={<XIcon size={14} color={colors.mutedForeground} />}
							variant="ghost"
							size="icon-sm"
							onPress={() => onRemove(file.id)}
							accessibilityLabel={`Remove ${file.name}`}
						/>
					</View>
				);
			})}
		</View>
	);
}
