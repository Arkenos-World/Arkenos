"use client";

import { useState } from "react";
import {
    File,
    FileCode,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Plus,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AgentFile } from "@/lib/api";

interface FileTreeNode {
    name: string;
    path: string;
    type: "file" | "directory";
    children?: FileTreeNode[];
}

interface FileTreeProps {
    files: AgentFile[];
    activeFile: string | null;
    onFileSelect: (filePath: string) => void;
    onCreateFile: (filePath: string) => void;
    onDeleteFile: (filePath: string) => void;
}

function buildTree(files: AgentFile[]): FileTreeNode[] {
    const root: FileTreeNode[] = [];
    const dirMap = new Map<string, FileTreeNode>();

    for (const file of files) {
        const parts = file.file_path.split("/");
        let currentPath = "";

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const parentPath = currentPath;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (i === parts.length - 1) {
                const node: FileTreeNode = {
                    name: part,
                    path: currentPath,
                    type: "file",
                };
                if (parentPath && dirMap.has(parentPath)) {
                    dirMap.get(parentPath)!.children!.push(node);
                } else {
                    root.push(node);
                }
            } else {
                if (!dirMap.has(currentPath)) {
                    const dirNode: FileTreeNode = {
                        name: part,
                        path: currentPath,
                        type: "directory",
                        children: [],
                    };
                    dirMap.set(currentPath, dirNode);
                    if (parentPath && dirMap.has(parentPath)) {
                        dirMap.get(parentPath)!.children!.push(dirNode);
                    } else {
                        root.push(dirNode);
                    }
                }
            }
        }
    }

    const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
        return nodes.sort((a, b) => {
            if (a.type === "directory" && b.type === "file") return -1;
            if (a.type === "file" && b.type === "directory") return 1;
            return a.name.localeCompare(b.name);
        });
    };

    const sortTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
        for (const node of nodes) {
            if (node.children) {
                node.children = sortTree(sortNodes(node.children));
            }
        }
        return sortNodes(nodes);
    };

    return sortTree(root);
}

function TreeNode({
    node,
    activeFile,
    onFileSelect,
    onDeleteFile,
    depth = 0,
}: {
    node: FileTreeNode;
    activeFile: string | null;
    onFileSelect: (filePath: string) => void;
    onDeleteFile: (filePath: string) => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const [hovering, setHovering] = useState(false);
    const isActive = activeFile === node.path;

    if (node.type === "directory") {
        return (
            <div>
                <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-[13px] hover:bg-muted/50 text-muted-foreground mx-1"
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {expanded ? (
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    ) : (
                        <Folder className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    )}
                    <span className="truncate">{node.name}</span>
                </div>
                {expanded && node.children && (
                    <div>
                        {node.children.map((child) => (
                            <TreeNode
                                key={child.path}
                                node={child}
                                activeFile={activeFile}
                                onFileSelect={onFileSelect}
                                onDeleteFile={onDeleteFile}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-[13px] group mx-1 ${
                isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            style={{ paddingLeft: `${depth * 12 + 20}px` }}
            onClick={() => onFileSelect(node.path)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <File className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate flex-1">{node.name}</span>
            {hovering && (
                <button
                    className="h-5 w-5 shrink-0 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(node.path);
                    }}
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}

export function FileTree({
    files,
    activeFile,
    onFileSelect,
    onCreateFile,
    onDeleteFile,
}: FileTreeProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const tree = buildTree(files);

    const handleCreate = () => {
        if (newFileName.trim()) {
            onCreateFile(newFileName.trim());
            setNewFileName("");
            setIsCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-3 h-9 border-b bg-muted/20">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Explorer
                </span>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsCreating(!isCreating)}
                    title="New file"
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>

            {isCreating && (
                <div className="px-2 py-2 border-b bg-muted/10">
                    <Input
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreate();
                            if (e.key === "Escape") {
                                setIsCreating(false);
                                setNewFileName("");
                            }
                        }}
                        placeholder="path/to/file.py"
                        className="h-7 text-xs font-mono"
                        autoFocus
                    />
                </div>
            )}

            <div className="flex-1 overflow-y-auto py-1">
                {tree.map((node) => (
                    <TreeNode
                        key={node.path}
                        node={node}
                        activeFile={activeFile}
                        onFileSelect={onFileSelect}
                        onDeleteFile={onDeleteFile}
                    />
                ))}
                {tree.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center mb-3">
                            <FileCode className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                            No files yet
                        </p>
                        <p className="text-[11px] text-muted-foreground/60">
                            Click <span className="font-mono bg-muted px-1 rounded">+</span> to create your first file
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
