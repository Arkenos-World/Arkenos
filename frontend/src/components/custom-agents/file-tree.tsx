"use client";

import { useState } from "react";
import {
    File,
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
                    className="flex items-center gap-1 px-2 py-1 rounded-sm cursor-pointer text-sm hover:bg-muted/50 text-muted-foreground"
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
            className={`flex items-center gap-1 px-2 py-1 rounded-sm cursor-pointer text-sm group ${
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
                    className="h-4 w-4 shrink-0 text-muted-foreground hover:text-destructive"
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
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Files
                </span>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsCreating(!isCreating)}
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>

            {isCreating && (
                <div className="px-2 py-2 border-b">
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
                        className="h-7 text-xs"
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
                    <p className="text-xs text-muted-foreground text-center py-8 px-4">
                        No files yet. Click + to create one.
                    </p>
                )}
            </div>
        </div>
    );
}
