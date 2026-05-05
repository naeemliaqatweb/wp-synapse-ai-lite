import React, { useState, useEffect, useRef } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Atom, FileCode, FileJson, FileType, Image as ImageIcon, Terminal, Plus, FolderPlus, Trash2, X, Check, Edit2, MoreVertical } from 'lucide-react';

const getFileIcon = (filename) => {
    if (!filename) return <File size={12} color="#94a3b8" />;
    const ext = filename.split('.').pop().toLowerCase();
    
    switch (ext) {
        case 'jsx':
        case 'tsx':
            return <Atom size={12} color="#61dafb" className="lang-icon" />;
        case 'js':
        case 'ts':
            return <FileCode size={12} color="#f7df1e" className="lang-icon" />;
        case 'php':
            return <Terminal size={12} color="#777bb4" className="lang-icon" />;
        case 'json':
            return <FileJson size={12} color="#cbd5e1" className="lang-icon" />;
        case 'css':
        case 'scss':
            return <FileType size={12} color="#3b82f6" className="lang-icon" />;
        case 'png':
        case 'jpg':
        case 'svg':
            return <ImageIcon size={12} color="#10b981" className="lang-icon" />;
        case 'html':
            return <FileCode size={12} color="#ef4444" className="lang-icon" />;
        default:
            return <File size={12} color="#94a3b8" className="lang-icon" />;
    }
};

const FileItem = ({ node, onFileClick, onCreateFile, onCreateFolder, onDeleteItem, onRenameItem, onRefresh }) => {
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

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${window.wpSynapseAILite.root}/files?path=${encodeURIComponent(node.path)}`, {
        headers: { 'X-WP-Nonce': window.wpSynapseAILite.nonce }
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

  return (
    <div style={{ paddingLeft: '0.4rem' }}>
      <div 
        className="file-item"
        onClick={showInput === 'rename' ? null : handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '2px 6px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          borderRadius: '4px',
          transition: 'background 0.1s',
          color: node.type === 'directory' ? 'var(--text-primary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          position: 'relative'
        }}
      >
        {node.type === 'directory' ? (
          isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : (
          <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
             {getFileIcon(node.name)}
          </div>
        )}
        {node.type === 'directory' && <Folder size={12} style={{ color: '#3b82f6' }} />}
        
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
                        fontSize: '0.75rem',
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
                    <MoreVertical size={14} style={{ color: 'var(--text-secondary)' }} />
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
                {showInput === 'file' ? <File size={10} /> : <Folder size={10} />}
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
                        fontSize: '0.75rem',
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
          {children.map((child, i) => (
            <FileItem 
                key={i} 
                node={child} 
                onFileClick={onFileClick} 
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onDeleteItem={onDeleteItem}
                onRenameItem={onRenameItem}
                onRefresh={fetchChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ files, onFileClick, onCreateFile, onCreateFolder, onDeleteItem, onRenameItem, rootPath }) => {
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

  return (
    <div className="file-tree-container" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div className="file-tree-toolbar" style={{ 
          padding: '0.4rem 0.8rem', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '10px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          position: 'sticky',
          top: 0,
          zIndex: 5
      }}>
          <button 
            onClick={() => { setShowInput('file'); setInputValue(''); setErrorMessage(''); }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
          >
              <Plus size={14} /> File
          </button>
          <button 
            onClick={() => { setShowInput('folder'); setInputValue(''); setErrorMessage(''); }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
          >
              <FolderPlus size={14} /> Folder
          </button>
      </div>

      <div style={{ padding: '0.5rem' }}>
        {showInput && (
            <div style={{ paddingLeft: '0.4rem', display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {showInput === 'file' ? <File size={12} /> : <Folder size={12} />}
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

        {files.map((file, i) => (
            <FileItem 
                key={i} 
                node={file} 
                onFileClick={onFileClick} 
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onDeleteItem={onDeleteItem}
                onRenameItem={onRenameItem}
            />
        ))}
      </div>
    </div>
  );
};

export default FileTree;
