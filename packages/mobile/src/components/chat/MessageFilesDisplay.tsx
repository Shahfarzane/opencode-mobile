import { useMemo } from "react";
import { Image, Text, View } from "react-native";
import { FileIcon, ImageIcon } from "@/components/icons";
import { typography, useTheme } from "@/theme";
import type { FilePart } from "@/lib/streaming";

interface MessageFilesDisplayProps {
	files: FilePart[];
}

function extractFilename(path?: string): string {
	if (!path) return "Unnamed file";

	const normalized = path.replace(/\\/g, "/");
	const parts = normalized.split("/");
	return parts[parts.length - 1] || path;
}

export function MessageFilesDisplay({ files }: MessageFilesDisplayProps) {
	const { colors } = useTheme();

	const imageFiles = useMemo(
		() => (files || []).filter((f) => f.mime?.startsWith("image/") && f.url),
		[files],
	);
	const otherFiles = useMemo(
		() => (files || []).filter((f) => !f.mime?.startsWith("image/")),
		[files],
	);

	if (!files || files.length === 0) return null;

	return (
		<View className="gap-2 mt-2">
			{otherFiles.length > 0 && (
				<View className="flex-row flex-wrap gap-2">
					{otherFiles.map((file, index) => (
						<View
							key={`file-${file.id || index}`}
							className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-xl border"
							style={{
								backgroundColor: `${colors.muted}30`,
								borderColor: `${colors.border}30`,
							}}
						>
							<FileIcon size={14} color={colors.mutedForeground} />
							<Text
								style={[typography.meta, { color: colors.foreground }]}
								numberOfLines={1}
							>
								{extractFilename(file.filename)}
							</Text>
						</View>
					))}
				</View>
			)}

			{imageFiles.length > 0 && (
				<View className="flex-row gap-3">
					{imageFiles.map((file, index) => {
						const filename = extractFilename(file.filename) || "Image";

						return (
							<View
								key={`img-${file.id || index}`}
								className="w-16 h-16 rounded-xl border overflow-hidden"
								style={{
									borderColor: `${colors.border}40`,
									backgroundColor: `${colors.muted}10`,
								}}
							>
								{file.url ? (
									<Image
										source={{ uri: file.url }}
										className="w-full h-full"
										resizeMode="cover"
										accessibilityLabel={filename}
									/>
								) : (
									<View className="flex-1 items-center justify-center">
										<ImageIcon size={24} color={colors.mutedForeground} />
									</View>
								)}
							</View>
						);
					})}
				</View>
			)}
		</View>
	);
}
