"use client";

import { useRef, useCallback, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { File } from "lucide-react";

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
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <File className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm">Select a file to edit</p>
            </div>
        );
    }

    const fileName = filePath.split("/").pop() ?? filePath;

    return (
        <div className="flex flex-col h-full">
            {/* Tab bar */}
            <div className="flex items-center h-9 border-b bg-muted/30 px-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-background border border-b-0 rounded-t text-xs font-medium">
                    <File className="h-3 w-3" />
                    {fileName}
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
