import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

type GitStatus = {
	branch: string;
	ahead: number;
	behind: number;
	staged: string[];
	modified: string[];
	untracked: string[];
};

function FileItem({
	path,
	status,
}: {
	path: string;
	status: "staged" | "modified" | "untracked";
}) {
	const statusColors = {
		staged: "text-success",
		modified: "text-warning",
		untracked: "text-muted-foreground",
	};

	const statusIcons = {
		staged: "A",
		modified: "M",
		untracked: "?",
	};

	return (
		<View className="flex-row items-center gap-3 px-4 py-3">
			<View className={`w-6 items-center ${statusColors[status]}`}>
				<Text className={`font-mono font-bold ${statusColors[status]}`}>
					{statusIcons[status]}
				</Text>
			</View>
			<Text
				className="flex-1 font-mono text-sm text-foreground"
				numberOfLines={1}
			>
				{path}
			</Text>
		</View>
	);
}

function SectionHeader({ title, count }: { title: string; count: number }) {
	return (
		<View className="flex-row items-center justify-between bg-muted px-4 py-2">
			<Text className="font-mono text-sm font-medium text-muted-foreground">
				{title}
			</Text>
			<View className="rounded-full bg-card px-2 py-0.5">
				<Text className="font-mono text-xs text-muted-foreground">{count}</Text>
			</View>
		</View>
	);
}

export default function GitScreen() {
	const insets = useSafeAreaInsets();

	const mockStatus: GitStatus = {
		branch: "main",
		ahead: 2,
		behind: 0,
		staged: ["src/api/auth.ts", "src/hooks/useAuth.ts"],
		modified: ["src/components/ChatInput.tsx", "package.json"],
		untracked: ["src/lib/new-feature.ts"],
	};

	return (
		<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
			<View className="border-b border-border px-4 py-3">
				<Text className="font-mono text-lg font-semibold text-foreground">
					Git
				</Text>
			</View>

			<View className="flex-row items-center justify-between border-b border-border px-4 py-4">
				<View className="flex-row items-center gap-2">
					<Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
						<Path
							d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
							stroke="#EC8B49"
							strokeWidth={2}
							strokeLinecap="round"
						/>
						<Path
							d="M18 9a9 9 0 0 1-9 9"
							stroke="#EC8B49"
							strokeWidth={2}
							strokeLinecap="round"
						/>
					</Svg>
					<Text className="font-mono text-base font-medium text-foreground">
						{mockStatus.branch}
					</Text>
				</View>
				<View className="flex-row items-center gap-2">
					{mockStatus.ahead > 0 && (
						<Text className="font-mono text-sm text-success">
							↑{mockStatus.ahead}
						</Text>
					)}
					{mockStatus.behind > 0 && (
						<Text className="font-mono text-sm text-destructive">
							↓{mockStatus.behind}
						</Text>
					)}
				</View>
			</View>

			<ScrollView className="flex-1">
				{mockStatus.staged.length > 0 && (
					<View>
						<SectionHeader
							title="Staged Changes"
							count={mockStatus.staged.length}
						/>
						{mockStatus.staged.map((file) => (
							<FileItem key={file} path={file} status="staged" />
						))}
					</View>
				)}

				{mockStatus.modified.length > 0 && (
					<View>
						<SectionHeader
							title="Modified"
							count={mockStatus.modified.length}
						/>
						{mockStatus.modified.map((file) => (
							<FileItem key={file} path={file} status="modified" />
						))}
					</View>
				)}

				{mockStatus.untracked.length > 0 && (
					<View>
						<SectionHeader
							title="Untracked"
							count={mockStatus.untracked.length}
						/>
						{mockStatus.untracked.map((file) => (
							<FileItem key={file} path={file} status="untracked" />
						))}
					</View>
				)}
			</ScrollView>

			<View
				className="flex-row gap-3 border-t border-border px-4 py-4"
				style={{ paddingBottom: insets.bottom + 16 }}
			>
				<Pressable className="flex-1 items-center rounded-lg border border-border bg-card py-3 active:opacity-80">
					<Text className="font-mono font-medium text-foreground">Pull</Text>
				</Pressable>
				<Pressable className="flex-1 items-center rounded-lg bg-primary py-3 active:opacity-80">
					<Text className="font-mono font-medium text-primary-foreground">
						Commit
					</Text>
				</Pressable>
				<Pressable className="flex-1 items-center rounded-lg border border-border bg-card py-3 active:opacity-80">
					<Text className="font-mono font-medium text-foreground">Push</Text>
				</Pressable>
			</View>
		</View>
	);
}
