export function getToolDisplayName(toolName: string): string {
	const tool = toolName.toLowerCase();

	if (
		tool === "edit" ||
		tool === "multiedit" ||
		tool === "str_replace" ||
		tool === "str_replace_based_edit_tool"
	) {
		return "edit";
	}
	if (tool === "write" || tool === "create" || tool === "file_write") {
		return "write";
	}
	if (
		tool === "bash" ||
		tool === "shell" ||
		tool === "cmd" ||
		tool === "terminal" ||
		tool === "shell_command"
	) {
		return "bash";
	}
	if (
		tool === "webfetch" ||
		tool === "fetch" ||
		tool === "curl" ||
		tool === "wget"
	) {
		return "webfetch";
	}

	return toolName;
}
