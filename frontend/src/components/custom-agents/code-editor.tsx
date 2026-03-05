"use client";

import { useRef, useCallback, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { File, FileCode } from "lucide-react";

interface CodeEditorProps {
    filePath: string | null;
    content: string;
    onChange: (content: string) => void;
    onSave: (content: string) => void;
    readOnly?: boolean;
}

function getLanguage(filePath: string): string {
    if (filePath.endsWith(".py")) return "python";
    if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return "yaml";
    if (filePath.endsWith(".json")) return "json";
    if (filePath.endsWith(".md")) return "markdown";
    if (filePath.endsWith(".toml")) return "ini";
    if (filePath.endsWith(".txt")) return "plaintext";
    if (filePath.endsWith(".sh")) return "shell";
    if (filePath.endsWith(".dockerfile") || filePath.endsWith("Dockerfile")) return "dockerfile";
    return "plaintext";
}

export function CodeEditor({
    filePath,
    content,
    onChange,
    onSave,
    readOnly = false,
}: CodeEditorProps) {
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSave = useCallback(
        (value: string) => {
            onSave(value);
        },
        [onSave]
    );

    const handleEditorMount: OnMount = (editor) => {
        editorRef.current = editor;

        editor.addCommand(
            // Monaco KeyMod.CtrlCmd | Monaco KeyCode.KeyS
            2048 | 49, // CtrlCmd + S
            () => {
                const value = editor.getValue();
                handleSave(value);
            }
        );
    };

    const handleChange = (value: string | undefined) => {
        const v = value ?? "";
        onChange(v);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            handleSave(v);
        }, 800);
    };

    const handleBlur = () => {
        if (editorRef.current) {
            const value = editorRef.current.getValue();
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            handleSave(value);
        }
    };

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    if (!filePath) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="h-14 w-14 rounded-xl bg-muted/40 flex items-center justify-center mb-4">
                    <FileCode className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">No file open</p>
                <p className="text-xs text-muted-foreground/50">Select a file from the explorer or create a new one</p>
            </div>
        );
    }

    const fileName = filePath.split("/").pop() ?? filePath;

    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="flex items-center h-9 border-b bg-muted/20 px-1">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-background border border-b-background rounded-t text-xs font-medium -mb-px relative z-10">
                    <File className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-[200px]">{fileName}</span>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1" onBlur={handleBlur}>
                <Editor
                    height="100%"
                    language={getLanguage(filePath)}
                    theme="vs-dark"
                    value={content}
                    onChange={handleChange}
                    onMount={handleEditorMount}
                    options={{
                        readOnly,
                        fontSize: 13,
                        minimap: { enabled: false },
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        tabSize: 4,
                        insertSpaces: true,
                        automaticLayout: true,
                        padding: { top: 8 },
                    }}
                />
            </div>
        </div>
    );
}
