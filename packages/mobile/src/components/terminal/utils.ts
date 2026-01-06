/**
 * Remove all ANSI escape sequences from text
 */
export function stripAnsiCodes(text: string): string {
	return text
		.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "") // SGR and other CSI sequences
		.replace(/\x1b\][^\x07]*\x07/g, "") // OSC sequences
		.replace(/\x1b\[\?[0-9;]*[hl]/g, "") // Private mode set/reset
		.replace(/\x1b[=>]/g, ""); // Other escape sequences
}
