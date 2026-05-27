import React from 'react';
import { 
    File, 
    FileCode, 
    FileJson, 
    FileType, 
    Image as ImageIcon, 
    Terminal, 
    Archive, 
    FileText, 
    FileCode2,
    Code,
    Cpu,
    Globe,
    Settings,
    Database,
    Hash
} from 'lucide-react';

export const getFileIcon = (filename, size = 12) => {
    if (!filename) return <File size={size} color="#94a3b8" />;
    
    const parts = filename.split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
    
    // VS Code-like mapping
    switch (ext) {
        case 'php':
            return <FileCode2 size={size} color="#777bb4" />; // PHP Blue/Purple
        case 'js':
            return <FileCode size={size} color="#f7df1e" />; // JS Yellow
        case 'jsx':
        case 'tsx':
            return <Code size={size} color="#61dafb" />; // React Blue
        case 'ts':
            return <FileCode size={size} color="#3178c6" />; // TS Blue
        case 'css':
        case 'scss':
        case 'sass':
            return <Hash size={size} color="#3b82f6" />; // CSS Blue
        case 'html':
            return <Globe size={size} color="#ef4444" />; // HTML Red
        case 'json':
            return <FileJson size={size} color="#f59e0b" />; // JSON Orange
        case 'md':
            return <FileText size={size} color="#3b82f6" />; // MD Blue
        case 'zip':
        case 'rar':
        case '7z':
        case 'gz':
            return <Archive size={size} color="#f59e0b" />; // Archive Orange
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
        case 'ico':
            return <ImageIcon size={size} color="#10b981" />; // Image Green
        case 'env':
        case 'htaccess':
        case 'conf':
        case 'ini':
            return <Settings size={size} color="#94a3b8" />; // Config Grey
        case 'sql':
            return <Database size={size} color="#3b82f6" />; // DB Blue
        default:
            return <File size={size} color="#94a3b8" />;
    }
};
