import React, { useState, useEffect, useRef } from 'react';
import { Folder, ChevronRight, ChevronDown, Plus, FolderPlus, Trash2, X, Check, Edit2, MoreVertical, Archive, PackageOpen, Upload, RefreshCw, FolderMinus, ZoomIn, ZoomOut, Copy, Move, Search } from 'lucide-react';
import { getFileIcon } from '../utils/icons';
import { useFeatures } from './FeatureContext';

const FileItem = ({ node, onFileClick, onCreateFile, onCreateFolder, onDeleteItem, onRenameItem, onZipItem, onUnzipItem, onUploadFile, onOpenUpload, onRefresh, refreshTrigger, collapseAllTrigger, treeFontSize, onDuplicateItem, onMoveItem, onOpenMoveModal }) => {
  const { isEnabled } = useFeatures();
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showInput, setShowInput] = useState(false); // 'file' or 'folder' or 'rename' or false
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setShowMenu(false);
        }
    };
    if (showMenu) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    if (isOpen && refreshTrigger !== undefined) {
        fetchChildren();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (collapseAllTrigger !== undefined) {
        setIsOpen(false);
    }
  }, [collapseAllTrigger]);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/files?path=${encodeURIComponent(node.path)}`, {
        headers: { 'X-WP-Nonce': window.wpSynapseAI.nonce }
      });
      const data = await response.json();
      setChildren(data);
    } catch (err) {
      console.error("Failed to load sub-files", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (node.type === 'directory') {
      const newOpenState = !isOpen;
      setIsOpen(newOpenState);
      
      if (newOpenState && children.length === 0) {
        await fetchChildren();
      }
    } else {
      onFileClick(node);
    }
  };

  const handleCreateSubmit = async () => {
    if (!inputValue) {
        setShowInput(false);
        return;
    }
    
    const type = showInput;
    const name = inputValue;
    
    // Optimistically close input if it's not a rename (since rename might fail and we want to keep name)
    if (type !== 'rename') {
        setShowInput(false);
        setInputValue('');
    }

    setLoading(true);
    setErrorMessage('');
    
    let result;
    if (type === 'file') {
        result = await onCreateFile(node.path, name);
    } else if (type === 'folder') {
        result = await onCreateFolder(node.path, name);
    } else if (type === 'rename') {
        result = await onRenameItem(node.path, name);
    } else if (type === 'duplicate') {
        result = await onDuplicateItem(node.path, name);
    } else if (type === 'move') {
        result = await onMoveItem(node.path, name);
    }

    if (result.success) {
        if (type !== 'rename') {
            setIsOpen(true);
            fetchChildren(); // Background fetch
        } else {
            setShowInput(false);
            setInputValue('');
        }
    } else {
        // Re-open and show error if it failed
        setShowInput(type);
        setInputValue(name);
        setErrorMessage(result.message);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleCreateSubmit();
    }
    if (e.key === 'Escape') {
        setShowInput(false);
        setInputValue('');
        setErrorMessage('');
    }
  };

  const handleBlur = () => {
    // If there's an error, don't close on blur so user can see/fix it
    if (errorMessage) return;

    if (inputValue) {
        handleCreateSubmit();
    } else {
        setShowInput(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    const success = await onDeleteItem(node.path);
    if (success && onRefresh) {
        onRefresh();
    }
  };

  const handleZip = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setLoading(true);
    await onZipItem(node.path);
    if (onRefresh) onRefresh();
    setLoading(false);
  };

  const handleUnzip = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setLoading(true);
    await onUnzipItem(node.path);
    if (onRefresh) onRefresh();
    setLoading(false);
  };

  const handleUploadClick = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onOpenUpload(node.path);
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', node.path);
    e.dataTransfer.effectAllowed = 'move';
    // Visual drag feedback
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    if (node.type === 'directory') {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (e) => {
    if (node.type === 'directory') {
        setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    if (node.type === 'directory') {
        e.preventDefault();
        setIsDragOver(false);
        const sourcePath = e.dataTransfer.getData('text/plain');
        if (sourcePath && sourcePath !== node.path) {
            setLoading(true);
            const result = await onMoveItem(sourcePath, node.path);
            if (!result.success) {
                // Toast is handled in App.jsx
            }
            setLoading(false);
        }
    }
  };

  const iconSize = Math.max(10, Math.round(treeFontSize * 15));

  return (
    <div style={{ paddingLeft: '0.4rem' }}>
      <div 
        className={`file-item ${isDragOver ? 'drag-over' : ''}`}
        onClick={showInput === 'rename' ? null : handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable={!showInput}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '2px 6px',
          cursor: 'pointer',
          fontSize: `${treeFontSize}rem`,
          borderRadius: '4px',
          transition: 'all 0.1s',
          color: node.type === 'directory' ? 'var(--text-primary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          position: 'relative',
          background: isDragOver ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
          border: isDragOver ? '1px dashed var(--accent)' : '1px solid transparent'
        }}
      >
        {node.type === 'directory' ? (
          isOpen ? <ChevronDown size={iconSize} /> : <ChevronRight size={iconSize} />
        ) : (
          <div style={{ marginLeft: `${iconSize}px`, display: 'flex', alignItems: 'center' }}>
             {getFileIcon(node.name, iconSize)}
          </div>
        )}
        {node.type === 'directory' && <Folder size={iconSize} style={{ color: '#3b82f6' }} />}
        
        {showInput === 'rename' ? (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <input 
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'var(--bg-primary)',
                        border: errorMessage ? '1px solid var(--error)' : '1px solid var(--accent)',
                        color: 'var(--text-primary)',
                        fontSize: `${treeFontSize * 0.9}rem`,
                        padding: '1px 4px',
                        borderRadius: '2px',
                        width: '100%'
                    }}
                />
                {errorMessage && <span style={{ color: 'var(--error)', fontSize: '0.6rem', marginTop: '2px' }}>{errorMessage}</span>}
            </div>
        ) : (
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
        )}
        
        {isHovered && !showInput && (
            <div style={{ position: 'relative' }} ref={menuRef}>
                <div 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    style={{ 
                        padding: '2px', 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center',
                        background: showMenu ? 'var(--bg-tertiary)' : 'transparent'
                    }}
                >
                    <MoreVertical size={iconSize + 2} style={{ color: 'var(--text-secondary)' }} />
                </div>

                {showMenu && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        zIndex: 100,
                        minWidth: '120px',
                        padding: '4px 0',
                        marginTop: '2px'
                    }}>
                        {node.type === 'directory' && (
                            <>
                                <div 
                                    className="menu-item"
                                    onClick={(e) => { e.stopPropagation(); setShowInput('file'); setInputValue(''); setShowMenu(false); }}
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                >
                                    <Plus size={12} /> New File
                                </div>
                                <div 
                                    className="menu-item"
                                    onClick={(e) => { e.stopPropagation(); setShowInput('folder'); setInputValue(''); setShowMenu(false); }}
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                >
                                    <FolderPlus size={12} /> New Folder
                                </div>
                                {isEnabled('uploads') && (
                                    <div 
                                        className="menu-item"
                                        onClick={handleUploadClick}
                                        style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                    >
                                        <Upload size={12} /> Upload File
                                    </div>
                                )}
                                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                            </>
                        )}
                        <div 
                            className="menu-item"
                            onClick={(e) => { e.stopPropagation(); setShowInput('rename'); setInputValue(node.name); setShowMenu(false); }}
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <Edit2 size={12} /> Rename
                        </div>
                        <div 
                            className="menu-item"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                const ext = node.name.includes('.') && node.type === 'file' ? node.name.split('.').pop() : '';
                                const base = ext ? node.name.substring(0, node.name.lastIndexOf('.')) : node.name;
                                const newName = `${base}-copy${ext ? '.' + ext : ''}`;
                                onDuplicateItem(node.path, newName); 
                                setShowMenu(false); 
                            }}
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <Copy size={12} /> Duplicate
                        </div>
                        <div 
                            className="menu-item"
                            onClick={(e) => { e.stopPropagation(); onOpenMoveModal(node.path); setShowMenu(false); }}
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <Search size={12} /> Move to Folder...
                        </div>
                        {isEnabled('zip_tools') && (
                            node.name.toLowerCase().endsWith('.zip') ? (
                                <div 
                                    className="menu-item"
                                    onClick={handleUnzip}
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                >
                                    <PackageOpen size={12} /> Extract ZIP
                                </div>
                            ) : (
                                <div 
                                    className="menu-item"
                                    onClick={handleZip}
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                    >
                                    <Archive size={12} /> Compress to ZIP
                                </div>
                            )
                        )}
                        <div 
                            className="menu-item"
                            onClick={handleDelete}
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--error)' }}
                        >
                            <Trash2 size={12} /> Delete
                        </div>
                    </div>
                )}
            </div>
        )}

        {loading && <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>...</span>}
      </div>

      {(showInput === 'file' || showInput === 'folder') && (
          <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {showInput === 'file' ? getFileIcon(inputValue, iconSize) : <Folder size={iconSize} style={{ color: '#3b82f6' }} />}
                <input 
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    style={{
                        background: 'var(--bg-primary)',
                        border: errorMessage ? '1px solid var(--error)' : '1px solid var(--accent)',
                        color: 'var(--text-primary)',
                        fontSize: `${treeFontSize * 0.9}rem`,
                        padding: '1px 4px',
                        borderRadius: '2px',
                        width: '100px'
                    }}
                />
                <Check size={12} className="text-success" onMouseDown={(e) => { e.preventDefault(); handleCreateSubmit(); }} />
                <X size={12} className="text-error" onMouseDown={(e) => { e.preventDefault(); setShowInput(false); setErrorMessage(''); }} />
              </div>
              {errorMessage && <span style={{ color: 'var(--error)', fontSize: '0.6rem', marginTop: '2px', marginLeft: '14px' }}>{errorMessage}</span>}
          </div>
      )}
      
      {node.type === 'directory' && isOpen && children.length > 0 && (
        <div style={{ marginLeft: '0.5rem', borderLeft: '1px solid var(--border)' }}>
          {children.map((child) => (
                <FileItem 
                    key={child.path} 
                    node={child} 
                    onFileClick={onFileClick} 
                    onCreateFile={onCreateFile}
                    onCreateFolder={onCreateFolder}
                    onDeleteItem={onDeleteItem}
                    onRenameItem={onRenameItem}
                    onZipItem={onZipItem}
                    onUnzipItem={onUnzipItem}
                    onUploadFile={onUploadFile}
                    onOpenUpload={onOpenUpload}
                    onRefresh={fetchChildren}
                    refreshTrigger={refreshTrigger}
                    collapseAllTrigger={collapseAllTrigger}
                    treeFontSize={treeFontSize}
                    onDuplicateItem={onDuplicateItem}
                    onMoveItem={onMoveItem}
                    onOpenMoveModal={onOpenMoveModal}
                />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ files, onFileClick, onCreateFile, onCreateFolder, onDeleteItem, onRenameItem, onZipItem, onUnzipItem, onUploadFile, onOpenUpload, onRefresh, rootPath, refreshTrigger, onCollapseAll, collapseAllTrigger, treeFontSize, setTreeFontSize, onDuplicateItem, onMoveItem, onOpenMoveModal }) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateSubmit = async () => {
    if (!inputValue) {
        setShowInput(false);
        return;
    }
    
    const type = showInput;
    const name = inputValue;
    setShowInput(false);
    setInputValue('');
    setErrorMessage('');
    
    let result;
    if (type === 'file') {
        result = await onCreateFile(rootPath, name);
    } else {
        result = await onCreateFolder(rootPath, name);
    }

    if (!result.success) {
        setShowInput(type);
        setInputValue(name);
        setErrorMessage(result.message);
    }
  };

  const handleBlur = () => {
    if (errorMessage) return;
    if (inputValue) {
        handleCreateSubmit();
    } else {
        setShowInput(false);
    }
  };

  const zoomIn = () => setTreeFontSize(prev => Math.min(prev + 0.1, 1.5));
  const zoomOut = () => setTreeFontSize(prev => Math.max(prev - 0.1, 0.5));

  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const handleRootDrop = async (e) => {
    e.preventDefault();
    setIsRootDragOver(false);
    const sourcePath = e.dataTransfer.getData('text/plain');
    if (sourcePath && sourcePath !== rootPath) {
        const result = await onMoveItem(sourcePath, rootPath);
        if (!result.success) {
            // Toast is handled in App.jsx
        }
    }
  };

  return (
    <div className="file-tree-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div className="file-tree-toolbar" style={{ 
          padding: '0.4rem 0.8rem', 
          display: 'flex', 
          justifyContent: 'flex-start', 
          gap: '8px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          position: 'sticky',
          top: 0,
          zIndex: 5
      }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button onClick={zoomOut} className="toolbar-btn" title="Zoom Out Tree"><ZoomOut size={14} /></button>
              <button onClick={zoomIn} className="toolbar-btn" title="Zoom In Tree"><ZoomIn size={14} /></button>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--border)', alignSelf: 'center' }} />
          
          <button 
            onClick={() => { setShowInput('file'); setInputValue(''); setErrorMessage(''); }}
            className="toolbar-btn"
            title="New File"
          >
              <Plus size={14} />
          </button>
          <button 
            onClick={() => { setShowInput('folder'); setInputValue(''); setErrorMessage(''); }}
            className="toolbar-btn"
            title="New Folder"
          >
              <FolderPlus size={14} />
          </button>
          
          <button 
            onClick={() => onCollapseAll && onCollapseAll()}
            className="toolbar-btn"
            title="Collapse All Folders"
          >
              <FolderMinus size={14} />
          </button>
      </div>

      <div 
        onDragOver={(e) => { e.preventDefault(); setIsRootDragOver(true); }}
        onDragEnter={() => setIsRootDragOver(true)}
        onDragLeave={() => setIsRootDragOver(false)}
        onDrop={handleRootDrop}
        style={{ 
            padding: '0.5rem', 
            flex: 1,
            background: isRootDragOver ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            transition: 'background 0.2s'
        }}
      >
        {showInput && (
            <div style={{ paddingLeft: '0.4rem', display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {showInput === 'file' ? getFileIcon(inputValue, 12) : <Folder size={12} style={{ color: '#3b82f6' }} />}
                    <input 
                        autoFocus
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleCreateSubmit(); }
                            if (e.key === 'Escape') setShowInput(false);
                        }}
                        onBlur={handleBlur}
                        style={{
                            background: 'var(--bg-primary)',
                            border: errorMessage ? '1px solid var(--error)' : '1px solid var(--accent)',
                            color: 'var(--text-primary)',
                            fontSize: '0.75rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            width: '120px'
                        }}
                    />
                </div>
                {errorMessage && <span style={{ color: 'var(--error)', fontSize: '0.6rem', marginTop: '2px', marginLeft: '16px' }}>{errorMessage}</span>}
            </div>
        )}

        {files.map((file) => (
            <FileItem 
                key={file.path} 
                node={file} 
                onFileClick={onFileClick} 
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onDeleteItem={onDeleteItem}
                onRenameItem={onRenameItem}
                onZipItem={onZipItem}
                onUnzipItem={onUnzipItem}
                onUploadFile={onUploadFile}
                onOpenUpload={onOpenUpload}
                onRefresh={onRefresh}
                refreshTrigger={refreshTrigger}
                collapseAllTrigger={collapseAllTrigger}
                treeFontSize={treeFontSize}
                onDuplicateItem={onDuplicateItem}
                onMoveItem={onMoveItem}
                onOpenMoveModal={onOpenMoveModal}
            />
        ))}
      </div>
    </div>
  );
};

export default FileTree;
