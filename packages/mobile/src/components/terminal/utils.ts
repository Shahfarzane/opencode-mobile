/**
 * Remove all ANSI escape sequences and control characters from text
 */
export function stripAnsiCodes(text: string): string {
	return text
		.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "") // SGR and other CSI sequences
		.replace(/\x1b\][^\x07]*\x07/g, "") // OSC sequences
		.replace(/\x1b\[\?[0-9;]*[hl]/g, "") // Private mode set/reset
		.replace(/\x1b[=>]/g, "") // Other escape sequences
		.replace(/\x1b\([A-Z0-9]/g, "") // Character set selection
		.replace(/\x1b/g, "") // Any remaining escape characters
		.replace(/\x07/g, "") // Bell character
		.replace(/\x0f/g, "") // Shift In
		.replace(/\x0e/g, "") // Shift Out
		.replace(/[\x00-\x06\x0b\x0c\x0e-\x1a\x1c-\x1f]/g, "") // Other control chars (except tab, newline, carriage return)
		.replace(/\r\n/g, "\n") // Normalize CRLF to LF
		.replace(/\r+/g, ""); // Remove carriage returns (used for line overwrites in terminals)
}
