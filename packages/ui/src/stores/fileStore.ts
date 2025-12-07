import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { opencodeClient } from "@/lib/opencode/client";
import type { AttachedFile } from "./types/sessionTypes";
import { getSafeStorage } from "./utils/safeStorage";

interface FileState {
    attachedFiles: AttachedFile[];
}

interface FileActions {
    addAttachedFile: (file: File) => Promise<void>;
    addServerFile: (path: string, name: string, content?: string) => Promise<void>;
    removeAttachedFile: (id: string) => void;
    clearAttachedFiles: () => void;
}

type FileStore = FileState & FileActions;

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const guessMimeType = (file: File): string => {
    if (file.type && file.type.trim().length > 0) {
        return file.type;
    }

    const name = (file.name || "").toLowerCase();
    const ext = name.includes(".") ? name.split(".").pop() || "" : "";
    const noExtNames = new Set([
        "license",
        "readme",
        "changelog",
        "notice",
        "authors",
        "copying",
    ]);

    if (noExtNames.has(name)) return "text/plain";

    switch (ext) {
        case "md":
        case "markdown":
            return "text/markdown";
        case "txt":
            return "text/plain";
        case "json":
            return "application/json";
        case "yaml":
        case "yml":
            return "application/x-yaml";
        case "ts":
        case "tsx":
        case "js":
        case "jsx":
        case "mjs":
        case "cjs":
        case "py":
        case "rb":
        case "sh":
        case "bash":
        case "zsh":
            return "text/plain";
        default:
            return "application/octet-stream";
    }
};

export const useFileStore = create<FileStore>()(

    devtools(
        persist(
            (set, get) => ({

                attachedFiles: [],

                addAttachedFile: async (file: File) => {

                        const { attachedFiles } = get();
                        const isDuplicate = attachedFiles.some((f) => f.filename === file.name && f.size === file.size);
                        if (isDuplicate) {
                            console.log(`File "${file.name}" is already attached`);
                            return;
                        }

                        const maxSize = MAX_ATTACHMENT_SIZE;
                        if (file.size > maxSize) {
                            throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`);
                        }

                        const allowedTypes = [
                            "text/",
                            "application/json",
                            "application/xml",
                            "application/pdf",
                            "image/",
                            "video/",
                            "audio/",
                            "application/javascript",
                            "application/typescript",
                            "application/x-python",
                            "application/x-ruby",
                            "application/x-sh",
                            "application/yaml",
                            "application/octet-stream",
                        ];

                        const mimeType = guessMimeType(file);
                        const isAllowed = allowedTypes.some((type) => mimeType.startsWith(type) || mimeType === type || mimeType === "");

                        if (!isAllowed && mimeType !== "") {
                            console.warn(`File type "${mimeType}" might not be supported`);
                        }

                        const reader = new FileReader();
                        const rawDataUrl = await new Promise<string>((resolve, reject) => {
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });

                        const dataUrl = rawDataUrl.startsWith("data:")
                            ? rawDataUrl.replace(/^data:[^;]*/, `data:${mimeType}`)
                            : rawDataUrl;

                        const extractFilename = (fullPath: string) => {

                            const parts = fullPath.replace(/\\/g, "/").split("/");
                            return parts[parts.length - 1] || fullPath;
                        };

                        const attachedFile: AttachedFile = {
                            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            file,
                            dataUrl,
                            mimeType,
                            filename: extractFilename(file.name),
                            size: file.size,
                            source: "local",
                        };

                        set((state) => ({
                            attachedFiles: [...state.attachedFiles, attachedFile],
                        }));
                },

                addServerFile: async (path: string, name: string, content?: string) => {

                        const { attachedFiles } = get();
                        const isDuplicate = attachedFiles.some((f) => f.serverPath === path && f.source === "server");
                        if (isDuplicate) {
                            console.log(`Server file "${name}" is already attached`);
                            return;
                        }

                        let fileContent = content;
                        if (!fileContent) {
                            try {

                                const tempClient = opencodeClient.getApiClient();

                                const lastSlashIndex = path.lastIndexOf("/");
                                const directory = lastSlashIndex > 0 ? path.substring(0, lastSlashIndex) : "/";
                                const filename = lastSlashIndex > 0 ? path.substring(lastSlashIndex + 1) : path;

                                const response = await tempClient.file.read({
                                    query: {
                                        path: filename,
                                        directory: directory,
                                    },
                                });

                                if (response.data && "content" in response.data) {
                                    fileContent = response.data.content;
                                } else {
                                    fileContent = "";
                                }
                            } catch (error) {
                                console.error("Failed to read server file:", error);

                                fileContent = `[File: ${name}]`;
                            }
                        }

                        const blob = new Blob([fileContent || ""], { type: "text/plain" });

                        if (blob.size > MAX_ATTACHMENT_SIZE) {
                            throw new Error(`File "${name}" is too large. Maximum size is 10MB.`);
                        }

                        const file = new File([blob], name, { type: "text/plain" });

                        const encoder = new TextEncoder();
                        const data = encoder.encode(fileContent || "");
                        const base64 = btoa(String.fromCharCode(...data));
                        const dataUrl = `data:text/plain;base64,${base64}`;

                        const attachedFile: AttachedFile = {
                            id: `server-file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            file,
                            dataUrl,
                            mimeType: "text/plain",
                            filename: name,
                            size: blob.size,
                            source: "server",
                            serverPath: path,
                        };

                        set((state) => ({
                            attachedFiles: [...state.attachedFiles, attachedFile],
                        }));
                },

                removeAttachedFile: (id: string) => {
                    set((state) => ({
                        attachedFiles: state.attachedFiles.filter((f) => f.id !== id),
                    }));
                },

                clearAttachedFiles: () => {
                    set({ attachedFiles: [] });
                },
            }),
            {
                name: "file-store",
                storage: createJSONStorage(() => getSafeStorage()),
                partialize: (state) => ({
                    attachedFiles: state.attachedFiles,
                }),
            }
        ),
        {
            name: "file-store",
        }
    )
);
