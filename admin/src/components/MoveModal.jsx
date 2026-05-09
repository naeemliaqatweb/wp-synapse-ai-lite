import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Folder, ChevronRight, ChevronDown, Move, Search, Loader2 } from 'lucide-react';

const FolderBrowser = ({ currentPath, onSelect, treeFontSize }) => {
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});

    const fetchFolders = async (path = '') => {
        setLoading(true);
        try {
            const response = await fetch(`${window.wpSynapseAILite.root}/files?path=${encodeURIComponent(path)}`, {
                headers: { 'X-WP-Nonce': window.wpSynapseAILite.nonce }
            });
            const data = await response.json();
            // Filter only directories
            setFolders(data.filter(item => item.type === 'directory'));
        } catch (err) {
            console.error("Failed to load folders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders('');
    }, []);

    const toggleFolder = async (path) => {
        if (expanded[path]) {
            setExpanded({ ...expanded, [path]: null });
        } else {
            // In a simple version, we just select it. 
            // In a complex version, we would fetch subfolders.
            // For now, let's just make it a flat-ish selector or simple recursive one.
            onSelect(path);
            setExpanded({ ...expanded, [path]: true });
        }
    };

    return (
        <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div 
                onClick={() => onSelect('')}
                style={{ 
                    padding: '8px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    background: currentPath === '' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    borderRadius: '4px'
                }}
            >
                <Folder size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.85rem' }}>Root Directory (/)</span>
            </div>
            
            {loading && folders.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}><Loader2 size={20} className="animate-spin" /></div>
            ) : (
                folders.map(folder => (
                    <div 
                        key={folder.path}
                        onClick={() => onSelect(folder.path)}
                        style={{ 
                            padding: '8px', 
                            paddingLeft: '20px',
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            background: currentPath === folder.path ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                            borderRadius: '4px',
                            marginTop: '2px'
                        }}
                    >
                        <Folder size={16} style={{ color: '#3b82f6' }} />
                        <span style={{ fontSize: '0.85rem' }}>{folder.name}</span>
                    </div>
                ))
            )}
            <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '12px' }}>Note: Only top-level directories are shown. Drag and drop for precise nesting.</p>
        </div>
    );
};

const MoveModal = ({ isOpen, onClose, itemPath, onMove }) => {
    const [targetPath, setTargetPath] = useState('');
    const [isMoving, setIsMoving] = useState(false);

    const handleMove = async () => {
        setIsMoving(true);
        const result = await onMove(itemPath, targetPath);
        setIsMoving(false);
        if (result.success) {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Move Item"
            type="info"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Moving Item</div>
                    <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {itemPath}
                    </div>
                </div>

                <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Select Destination Folder</div>
                    <FolderBrowser currentPath={targetPath} onSelect={setTargetPath} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button 
                        className="synapse-btn secondary" 
                        onClick={onClose}
                        disabled={isMoving}
                    >
                        Cancel
                    </button>
                    <button 
                        className="synapse-btn" 
                        onClick={handleMove}
                        disabled={isMoving}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isMoving ? <Loader2 size={14} className="animate-spin" /> : <Move size={14} />}
                        Move Item
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MoveModal;
