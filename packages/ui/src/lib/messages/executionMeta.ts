export const EXECUTION_FORK_META_TEXT =
    "This message comes from an AI assistant in another session. The user wants you to respond according to its content: " +
    "if it is an implementation plan, your task is to implement that plan; " +
    "if it is a conclusion or summary, your task is to verify it, explain whether you agree or disagree, and correct it if needed. " +
    "Always clearly state what you understand your task to be, and wait for the user's approval of your conclusions before taking any further actions.";

export const isExecutionForkMetaText = (text: string | null | undefined): boolean =>
    typeof text === 'string' && text.trim() === EXECUTION_FORK_META_TEXT.trim();
