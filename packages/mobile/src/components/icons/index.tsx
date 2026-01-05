import Svg, { Circle, Path, Rect, type SvgProps } from "react-native-svg";

interface IconProps extends Omit<SvgProps, "width" | "height"> {
	size?: number;
	color?: string;
}

const defaultSize = 24;
const defaultColor = "currentColor";

export function ChatIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.955 9.955 0 0 0 12 22z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function TerminalIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Rect
				x="2"
				y="4"
				width="20"
				height="16"
				rx="2"
				stroke={color}
				strokeWidth={2}
			/>
			<Path
				d="M6 9l3 3-3 3M12 15h6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function GitBranchIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path d="M6 3v12" stroke={color} strokeWidth={2} strokeLinecap="round" />
			<Circle cx="6" cy="18" r="3" stroke={color} strokeWidth={2} />
			<Circle cx="18" cy="6" r="3" stroke={color} strokeWidth={2} />
			<Path
				d="M18 9a9 9 0 0 1-9 9"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function SettingsIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
				stroke={color}
				strokeWidth={2}
			/>
			<Path
				d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
				stroke={color}
				strokeWidth={2}
			/>
		</Svg>
	);
}

export function CodeIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M16 18l6-6-6-6M8 6l-6 6 6 6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function FolderIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function FileIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function SendIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function PlusIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 5v14M5 12h14"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function ChevronRightIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M9 18l6-6-6-6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function ChevronDownIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M6 9l6 6 6-6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function ChevronUpIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M18 15l-6-6-6 6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function CheckIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M20 6L9 17l-5-5"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function XIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M18 6L6 18M6 6l12 12"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function RefreshIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M23 4v6h-6M1 20v-6h6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function CopyIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Rect
				x="9"
				y="9"
				width="13"
				height="13"
				rx="2"
				stroke={color}
				strokeWidth={2}
			/>
			<Path
				d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function TrashIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function EditIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<Path
				d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function SearchIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
			<Path
				d="M21 21l-4.35-4.35"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function MenuIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M3 12h18M3 6h18M3 18h18"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function SidebarIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Rect
				x="3"
				y="3"
				width="18"
				height="18"
				rx="2"
				stroke={color}
				strokeWidth={2}
			/>
			<Path d="M9 3v18" stroke={color} strokeWidth={2} />
		</Svg>
	);
}

export function CommandIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function HelpIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
			<Path
				d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M12 17h.01"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function PlaylistAddIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M11 12H3M16 6H3M16 18H3M18 9v6M15 12h6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function InfoIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
			<Path
				d="M12 16v-4M12 8h.01"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function ClockIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
			<Path
				d="M12 6v6l4 2"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function BulbIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<Path
				d="M9 21h6M10 17v4M14 17v4"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function ToolIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function LayersIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function MoonIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function LogoutIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function GithubIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function StopIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Rect
				x="3"
				y="3"
				width="18"
				height="18"
				rx="2"
				stroke={color}
				strokeWidth={2}
			/>
		</Svg>
	);
}

export function LoaderIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function AttachmentIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function ImageIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Rect
				x="3"
				y="3"
				width="18"
				height="18"
				rx="2"
				stroke={color}
				strokeWidth={2}
			/>
			<Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
			<Path
				d="M21 15l-5-5L5 21"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function UploadIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function DownloadIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function ArrowUpIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 19V5M5 12l7-7 7 7"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function ArrowDownIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 5v14M19 12l-7 7-7-7"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function AlertCircleIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
			<Path
				d="M12 8v4M12 16h.01"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function StarIcon({
	size = defaultSize,
	color = defaultColor,
	fill,
	...props
}: IconProps & { fill?: string }) {
	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={fill || "none"}
			{...props}
		>
			<Path
				d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function GridIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth={2} />
			<Rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth={2} />
			<Rect x="14" y="14" width="7" height="7" stroke={color} strokeWidth={2} />
			<Rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth={2} />
		</Svg>
	);
}

export function QuestionIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
			<Path
				d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M12 17h.01"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function GlobeIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
			<Path d="M2 12h20" stroke={color} strokeWidth={2} />
			<Path
				d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
				stroke={color}
				strokeWidth={2}
			/>
		</Svg>
	);
}

export function PencilIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function FileEditIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M14 2v6h6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M12 18v-6M9 15h6"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function RobotIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M12 2v4M18 8h4M2 8h4M12 22c-4 0-8-3-8-8h16c0 5-4 8-8 8z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M9 14h.01M15 14h.01"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
			<Path d="M9 18h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
		</Svg>
	);
}

export function KeyIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function UsersIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={2} />
			<Path
				d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function ShareIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={2} />
			<Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={2} />
			<Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={2} />
			<Path
				d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function MoreVerticalIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="12" cy="5" r="1.5" fill={color} />
			<Circle cx="12" cy="12" r="1.5" fill={color} />
			<Circle cx="12" cy="19" r="1.5" fill={color} />
		</Svg>
	);
}

export function WarningIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M12 9v4M12 17h.01"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
			/>
		</Svg>
	);
}

export function LinkOffIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M9 17H7A5 5 0 0 1 7 7M15 7h2a5 5 0 0 1 4 8M8 12h4M2 2l20 20"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function ArrowsMergeIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M7 3v6l5 5 5-5V3M12 14v7"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}

export function PlusCircleIcon({
	size = defaultSize,
	color = defaultColor,
	...props
}: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
			<Path
				d="M12 8v8M8 12h8"
				stroke={color}
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}
