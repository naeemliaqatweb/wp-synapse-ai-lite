import React, { useState, useEffect } from 'react';
import FileTree from './components/FileTree';
import CodeWorkspace from './components/CodeWorkspace';
import UploadModal from './components/UploadModal';
import Modal from './components/Modal';
import SettingsManager from './components/SettingsManager';
import SidebarSearch from './components/SidebarSearch';
import MoveModal from './components/MoveModal';
import Toast from './components/Toast';
import { Terminal, Code, Sun, Moon, Zap, RefreshCw, Upload, Archive, PackageOpen, FolderOpen, Settings as SettingsIcon, ShieldCheck, HelpCircle, Sparkles, Search, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureProvider, useFeatures } from './components/FeatureContext';
import AIChat from './components/AIChat';
import FeatureLock from './components/FeatureLock';
import { getStorageItem, setStorageItem } from './utils/storage';

function App() {
  const [openFiles, setOpenFiles] = useState(() => {
    const saved = getStorageItem('open_files');
    if (!saved) return [];
    const files = JSON.parse(saved);
    return files.map(f => ({ ...f, originalContent: f.originalContent ?? f.content }));
  });
  const [activeFile, setActiveFile] = useState(() => {
    const saved = getStorageItem('active_file');
    return saved ? JSON.parse(saved) : null;
  });
  const [files, setFiles] = useState([]);
  const [rootPath, setRootPath] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(0);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetPath, setUploadTargetPath] = useState('');
  const [moveModal, setMoveModal] = useState({ isOpen: false, itemPath: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };
  
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, confirmText: 'OK' });
  
  const [sidebarWidth] = useState(310);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = getStorageItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [treeFontSize, setTreeFontSize] = useState(() => {
    const saved = getStorageItem('tree_font_size');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [editorFontSize, setEditorFontSize] = useState(() => {
    const saved = getStorageItem('editor_font_size');
    return saved ? parseInt(saved) : 13;
  });
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState('files');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(() => {
    return getStorageItem('chat_open') === 'true';
  });
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const [lastSelection, setLastSelection] = useState(null);

  const handleSelectionChange = (selection) => {
    setLastSelection(selection);
  };

  const handleAISearch = (text) => {
    setPendingPrompt(text);
    setIsChatOpen(true);
  };

  useEffect(() => {
    setStorageItem('chat_open', isChatOpen.toString());
  }, [isChatOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
      
      const safetyAck = getStorageItem('safety_ack');
      const now = new Date().getTime();
      if (!safetyAck || (now - parseInt(safetyAck)) > 24 * 60 * 60 * 1000) {
          setModal({
              isOpen: true,
              title: '⚠️ SAFETY FIRST',
              message: 'Editing live site code can be risky. Always double-check your syntax before saving.',
              type: 'info',
              confirmText: 'Got it',
              onConfirm: () => setStorageItem('safety_ack', new Date().getTime().toString())
          });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setStorageItem('tree_font_size', treeFontSize.toString());
  }, [treeFontSize]);

  useEffect(() => {
    setStorageItem('editor_font_size', editorFontSize.toString());
  }, [editorFontSize]);

  useEffect(() => {
    setStorageItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
          setShowSidebar(false);
      } else {
          setShowSidebar(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [rootPath]);

  useEffect(() => {
    setStorageItem('open_files', JSON.stringify(openFiles));
  }, [openFiles]);

  useEffect(() => {
    setStorageItem('active_file', JSON.stringify(activeFile));
  }, [activeFile]);



  const fetchFiles = async (path = '') => {
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/files?path=${encodeURIComponent(path)}`, {
        headers: { 'X-WP-Nonce': window.wpSynapseAI.nonce }
      });
      const data = await response.json();
      setFiles(data);
    } catch (err) { console.error("Fetch failed", err); }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    fetchFiles(rootPath);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCollapseAll = () => setCollapseAllTrigger(prev => prev + 1);

  const handleFileClick = async (file) => {
    if (file.type === 'directory') return;
    const isImage = /\.(png|jpe?g|gif|svg|webp|ico|bmp)$/i.test(file.name);
    const existingFile = openFiles.find(f => f.path === file.path);

    if (isImage) {
      const updatedFile = { ...(existingFile || file), isImage: true, url: file.url || existingFile?.url, line: file.line };
      if (!existingFile) setOpenFiles([...openFiles, updatedFile]);
      setActiveFile(updatedFile);
      return;
    }

     if (!existingFile) {
      setIsLoadingFile(true);
      try {
        const response = await fetch(`${window.wpSynapseAI.root}/file-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
          body: JSON.stringify({ path: file.path })
        });
        const data = await response.json();
        const newFile = { ...file, content: data.content, originalContent: data.content, isDirty: false, line: file.line };
        setOpenFiles([...openFiles, newFile]);
        setActiveFile(newFile);
      } catch (err) { console.error("Load failed", err); } finally { setIsLoadingFile(false); }
    } else {
      setActiveFile({ ...existingFile, line: file.line });
    }
  };

  const handleCreateFile = async (parentPath, name) => {
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/create-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
        body: JSON.stringify({ path: fullPath, content: '' })
      });
      const result = await response.json();
      if (result.status === 'success') { handleRefresh(); return { success: true }; }
      return { success: false, message: result.message };
    } catch (err) { return { success: false, message: "Error" }; }
  };

  const handleCreateFolder = async (parentPath, name) => {
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/create-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
        body: JSON.stringify({ path: fullPath })
      });
      const result = await response.json();
      if (result.status === 'success') { handleRefresh(); return { success: true }; }
      return { success: false, message: result.message };
    } catch (err) { return { success: false, message: "Error" }; }
  };

  const handleDeleteItem = async (path) => {
    setModal({
      isOpen: true, title: 'Confirm Delete', message: `Delete ${path}?`, type: 'error', confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const response = await fetch(`${window.wpSynapseAI.root}/delete-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
            body: JSON.stringify({ path })
          });
          if ((await response.json()).status === 'success') {
            setOpenFiles(openFiles.filter(f => !f.path.startsWith(path)));
            if (activeFile && activeFile.path.startsWith(path)) setActiveFile(null);
            handleRefresh();
          }
        } catch (err) { console.error(err); }
      }
    });
  };

  const handleRenameItem = async (oldPath, newName) => {
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/rename-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
        body: JSON.stringify({ path: oldPath, newName })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setOpenFiles(openFiles.map(f => f.path === oldPath ? { ...f, path: result.new_path, name: newName } : f));
        if (activeFile && activeFile.path === oldPath) setActiveFile({ ...activeFile, path: result.new_path, name: newName });
        handleRefresh();
        showToast('Item renamed successfully', 'success');
        return { success: true };
      }
      showToast(result.message || 'Rename failed', 'error');
      return { success: false, message: result.message };
    } catch (err) { 
        showToast('Error renaming item', 'error');
        return { success: false, message: "Error" }; 
    }
  };

  const handleDuplicateItem = async (path, newName) => {
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/duplicate-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
        body: JSON.stringify({ path, newName })
      });
      const data = await response.json();
      if (data.status === 'success') { 
        handleRefresh(); 
        showToast('Item duplicated successfully', 'success');
        return { success: true }; 
      }
      showToast(data.message || 'Failed to duplicate', 'error');
      return { success: false, message: data.message || 'Failed to duplicate item' };
    } catch (err) { 
        showToast('Error duplicating item', 'error');
        return { success: false, message: 'Network error' }; 
    }
  };

  const handleMoveItem = async (path, newParentPath) => {
    // Safety check: don't move if target is same as current parent
    const currentParent = path.substring(0, path.lastIndexOf('/'));
    if (currentParent === newParentPath) {
        showToast('Item is already in this location', 'warning');
        return { success: true }; 
    }

    try {
      const response = await fetch(`${window.wpSynapseAI.root}/move-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
        body: JSON.stringify({ path, newParentPath })
      });
      const data = await response.json();
      if (data.status === 'success') { 
        handleRefresh(); 
        showToast('Item moved successfully', 'success');
        return { success: true }; 
      }
      showToast(data.message || 'Failed to move', 'error');
      return { success: false, message: data.message || 'Failed to move item. Check if destination is writable.' };
    } catch (err) { 
        showToast('Error moving item', 'error');
        return { success: false, message: 'Network error occurred during move.' }; 
    }
  };

  const openMoveModal = (path) => {
    setMoveModal({ isOpen: true, itemPath: path });
  };

  const handleZipItem = async (path) => {
    try {
        const response = await fetch(`${window.wpSynapseAI.root}/zip-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
            body: JSON.stringify({ path })
        });
        if ((await response.json()).status === 'success') { handleRefresh(); setModal({ isOpen: true, title: 'Success', message: 'ZIP created', type: 'success' }); }
    } catch (err) { console.error(err); }
  };

  const handleUnzipItem = async (path) => {
    try {
        const response = await fetch(`${window.wpSynapseAI.root}/unzip-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
            body: JSON.stringify({ path })
        });
        if ((await response.json()).status === 'success') { handleRefresh(); setModal({ isOpen: true, title: 'Success', message: 'Extracted', type: 'success' }); }
    } catch (err) { console.error(err); }
  };

  const handleUploadFile = async (parentPath, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', parentPath);
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/upload-file?path=${encodeURIComponent(parentPath)}`, {
        method: 'POST',
        headers: { 'X-WP-Nonce': window.wpSynapseAI.nonce },
        body: formData
      });
      if ((await response.json()).status === 'success') { handleRefresh(); return { success: true }; }
      return { success: false };
    } catch (err) { return { success: false }; }
  };

  const openUploadModal = (path) => {
    setUploadTargetPath(path || rootPath);
    setIsUploadModalOpen(true);
  };

  return (
    <AnimatePresence mode="wait">
      {isInitialLoading ? (
        <motion.div 
          key="loader" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ height: '100vh', width: '100%', background: '#0D1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}
        >
          <motion.div
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
                style={{ width: '120px', height: '120px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 0 40px rgba(0, 122, 253, 0.3)' }}
            >
                <img src={window.wpSynapseAI.assetsUrl + '/logo.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} style={{ textAlign: 'center' }}>
                <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>Synapse <span style={{ color: 'var(--accent)' }}>Pro</span></h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                    <div className="loader-dots"><span></span><span></span><span></span></div>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Initializing Pro IDE</span>
                </div>
            </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`synapse-container lite-mode-ui ${isDarkMode ? 'dark-mode' : 'light-mode'} ${showSidebar ? 'sidebar-open' : ''}`} 
        >
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%', position: 'relative' }}>
              <nav style={{ width: '64px', background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px', zIndex: 101 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                    <img src={window.wpSynapseAI.assetsUrl + '/logo.png'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
                </div>
                {useFeatures().isEnabled('file_manager') && (
                    <button onClick={() => setActiveTab('files')} className={`nav-btn ${activeTab === 'files' ? 'active' : ''}`} title="File Manager"><FolderOpen size={20} /></button>
                )}
                {useFeatures().isEnabled('basic_search') && (
                    <button onClick={() => setActiveTab('search')} className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`} title="Search Files"><Search size={20} /></button>
                )}
                {useFeatures().isEnabled('ai_chat') && (
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className={`nav-btn ${isChatOpen ? 'active' : ''}`} title="AI Chat"><MessageSquare size={20} /></button>
                )}
                <button onClick={() => setActiveTab('settings')} className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} title="Settings"><SettingsIcon size={20} /></button>
                <div style={{ flex: 1 }}></div>
                {useFeatures().isEnabled('theme_toggle') && (
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="nav-btn" title="Toggle Theme">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                )}
              </nav>

                <aside className={`synapse-sidebar ${(activeTab === 'files' || activeTab === 'search') && showSidebar ? 'visible' : 'hidden'}`} style={{ width: window.innerWidth > 768 ? sidebarWidth : '280px' }}>
                    {activeTab === 'files' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', padding: '0.8rem', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="sidebar-title" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>EXPLORER</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button onClick={handleRefresh} className="header-action-btn" title="Refresh">
                                <motion.div
                                    animate={{ rotate: isRefreshing ? 360 : 0 }}
                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                    style={{ display: 'flex' }}
                                >
                                    <RefreshCw size={11} />
                                </motion.div>
                            </button>
                                {useFeatures().isEnabled('uploads') && (
                                    <button onClick={() => openUploadModal(rootPath)} className="header-action-btn" title="Upload"><Upload size={11} /></button>
                                )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <select value={rootPath} onChange={(e) => setRootPath(e.target.value)} className="sidebar-select" style={{ height: '32px' }}>
                                        <option value="">📁 Root</option>
                                        <option value="wp-content/themes">🎨 Themes</option>
                                        <option value="wp-content/plugins">🔌 Plugins</option>
                                    </select>
                                </div>
                            </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <FileTree 
                                    files={files} onFileClick={handleFileClick} onCreateFile={handleCreateFile} onCreateFolder={handleCreateFolder}
                                    onDeleteItem={handleDeleteItem} onRenameItem={handleRenameItem} onDuplicateItem={handleDuplicateItem}
                                    onMoveItem={handleMoveItem} onOpenMoveModal={openMoveModal} onZipItem={handleZipItem} onUnzipItem={handleUnzipItem}
                                    onUploadFile={handleUploadFile} onOpenUpload={openUploadModal} onRefresh={handleRefresh}
                                    refreshTrigger={refreshTrigger} onCollapseAll={handleCollapseAll} collapseAllTrigger={collapseAllTrigger}
                                    rootPath={rootPath} treeFontSize={treeFontSize} setTreeFontSize={setTreeFontSize}
                                />
                            </div>
                        </div>
                    )}
                    {activeTab === 'search' && <SidebarSearch onFileClick={handleFileClick} />}
                </aside>

                <main className="synapse-main" style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', height: '100%' }}>
                    {/* Section 3: Main Workspace */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
                        {activeTab === 'settings' ? (
                            <SettingsManager 
                                isDarkMode={isDarkMode} treeFontSize={treeFontSize} setTreeFontSize={setTreeFontSize} 
                                editorFontSize={editorFontSize} setEditorFontSize={setEditorFontSize} 
                            />
                        ) : (activeTab === 'files' || activeTab === 'search') ? (
                            <CodeWorkspace 
                                activeFile={activeFile} openFiles={openFiles} setOpenFiles={setOpenFiles} setActiveFile={setActiveFile} 
                                isDarkMode={isDarkMode} editorFontSize={editorFontSize} setEditorFontSize={setEditorFontSize} isLoadingFile={isLoadingFile}
                                onAISearch={handleAISearch}
                                onSelectionChange={handleSelectionChange}
                            />
                        ) : (
                            <div style={{ flex: 1, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                                    <SettingsIcon size={48} style={{ marginBottom: '16px' }} />
                                    <p>Select a tab from the sidebar</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 4: AI Chat Sidebar (Right) */}
                    <AnimatePresence>
                        {isChatOpen && (
                            <motion.aside 
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 400, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                style={{ 
                                    borderLeft: '1px solid var(--border)', 
                                    background: 'var(--bg-secondary)', 
                                    overflow: 'hidden', 
                                    position: 'relative',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flexShrink: 0
                                }}
                            >
                                <FeatureLock isLocked={!useFeatures().isEnabled('ai_chat')} featureName="AI Code Assistant">
                                    <AIChat 
                                        activeFile={activeFile} 
                                        onFileClick={handleFileClick} 
                                        onClose={() => setIsChatOpen(false)} 
                                        pendingPrompt={pendingPrompt}
                                        onPromptConsumed={() => setPendingPrompt(null)}
                                        onApplyCode={(code) => {
                                            if (!activeFile) return;
                                            
                                            let newContent = code;
                                            // If we have a selection, only replace that part of the file
                                            if (lastSelection && activeFile.content.includes(lastSelection.text)) {
                                                newContent = activeFile.content.replace(lastSelection.text, code);
                                            }

                                            const updatedFile = { ...activeFile, content: newContent, isDirty: true };
                                            setOpenFiles(openFiles.map(f => f.path === activeFile.path ? updatedFile : f));
                                            setActiveFile(updatedFile);
                                            showToast('AI suggestions applied to editor', 'success');
                                        }}
                                        onReviewCode={(suggestedCode) => {
                                            if (!activeFile) return;
                                            
                                            // 1. Remove existing Review prefixes to prevent growth
                                            const baseName = activeFile.name.replace(/^(Review:\s*)+/, '');
                                            const baseContent = activeFile.isDiff ? (activeFile.originalFile?.content || activeFile.content) : activeFile.content;
                                            const basePath = activeFile.isDiff ? (activeFile.originalFile?.path || activeFile.path.split('?diff=')[0]) : activeFile.path;

                                            // 2. Patch the content if a selection was active
                                            let fullSuggestedContent = suggestedCode;
                                            if (lastSelection && baseContent.includes(lastSelection.text)) {
                                                fullSuggestedContent = baseContent.replace(lastSelection.text, suggestedCode);
                                            }

                                            // 3. Check if a review tab for this base file already exists
                                            const existingDiffIndex = openFiles.findIndex(f => f.isDiff && f.path.startsWith(basePath + '?diff='));
                                            
                                            const diffFile = {
                                                path: basePath + '?diff=' + Date.now(),
                                                name: 'Review: ' + baseName,
                                                content: baseContent,
                                                suggested_content: fullSuggestedContent,
                                                isDiff: true,
                                                originalFile: activeFile.isDiff ? activeFile.originalFile : activeFile
                                            };

                                            if (existingDiffIndex !== -1) {
                                                // Replace existing diff tab
                                                const newOpenFiles = [...openFiles];
                                                newOpenFiles[existingDiffIndex] = diffFile;
                                                setOpenFiles(newOpenFiles);
                                            } else {
                                                setOpenFiles([...openFiles, diffFile]);
                                            }
                                            setActiveFile(diffFile);
                                        }}
                                    />
                                </FeatureLock>
                            </motion.aside>
                        )}
                    </AnimatePresence>
                </main>
          </div>

           <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} targetPath={uploadTargetPath} onUpload={handleUploadFile} isDarkMode={isDarkMode} />
           <MoveModal isOpen={moveModal.isOpen} itemPath={moveModal.itemPath} onClose={() => setMoveModal({ ...moveModal, isOpen: false })} onMove={handleMoveItem} />
           <Modal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />

           <AnimatePresence>
            {toast.show && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast({ ...toast, show: false })} 
                />
            )}
          </AnimatePresence>
         </motion.div>
       )}
     </AnimatePresence>
  );
}

export default App;
