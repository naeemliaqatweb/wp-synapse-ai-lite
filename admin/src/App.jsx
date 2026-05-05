import React, { useState, useEffect } from 'react';
import FileTree from './components/FileTree';
import CodeWorkspace from './components/CodeWorkspace';
import { Terminal, Code, Sun, Moon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [openFiles, setOpenFiles] = useState(() => {
    const saved = localStorage.getItem('synapse_open_files');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeFile, setActiveFile] = useState(() => {
    const saved = localStorage.getItem('synapse_active_file');
    return saved ? JSON.parse(saved) : null;
  });
  const [files, setFiles] = useState([]);
  const [rootPath, setRootPath] = useState('');
  
  // Resizing state
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('synapse_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('synapse_theme', isDarkMode ? 'dark' : 'light');
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
    fetchFiles(rootPath);
  }, [rootPath]);

  useEffect(() => {
    localStorage.setItem('synapse_open_files', JSON.stringify(openFiles));
  }, [openFiles]);

  useEffect(() => {
    localStorage.setItem('synapse_active_file', JSON.stringify(activeFile));
  }, [activeFile]);

  const handleMouseMove = (e) => {
    if (isResizingSidebar) {
      const newWidth = e.clientX - 160; // 160 is the WP sidebar width
      if (newWidth > 150 && newWidth < 400) setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizingSidebar(false);
  };

  useEffect(() => {
    if (isResizingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  const fetchFiles = async (path = '') => {
    try {
      const response = await fetch(`${window.wpSynapseAILite.root}/files?path=${encodeURIComponent(path)}`, {
        headers: {
          'X-WP-Nonce': window.wpSynapseAILite.nonce
        }
      });
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch files", err);
    }
  };

  const handleFileClick = async (file) => {
    if (file.type === 'directory') return;

    if (!openFiles.find(f => f.path === file.path)) {
      try {
        const response = await fetch(`${window.wpSynapseAILite.root}/file-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.wpSynapseAILite.nonce
          },
          body: JSON.stringify({ path: file.path })
        });
        const data = await response.json();
        const newFile = { ...file, content: data.content, isDirty: false };
        setOpenFiles([...openFiles, newFile]);
        setActiveFile(newFile);
      } catch (err) {
        console.error("Failed to load file content", err);
      }
    } else {
      setActiveFile(openFiles.find(f => f.path === file.path));
    }
  };



  const handleCreateFile = async (parentPath, name) => {
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    try {
      const response = await fetch(`${window.wpSynapseAILite.root}/create-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.wpSynapseAILite.nonce
        },
        body: JSON.stringify({ path: fullPath, content: '' })
      });
      const result = await response.json();
      if (result.status === 'success') {
        fetchFiles(rootPath);
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Failed to create file", err);
      return { success: false, message: "Network error" };
    }
  };

  const handleCreateFolder = async (parentPath, name) => {
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    try {
      const response = await fetch(`${window.wpSynapseAILite.root}/create-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.wpSynapseAILite.nonce
        },
        body: JSON.stringify({ path: fullPath })
      });
      const result = await response.json();
      if (result.status === 'success') {
        fetchFiles(rootPath);
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Failed to create folder", err);
      return { success: false, message: "Network error" };
    }
  };

  const handleDeleteItem = async (path) => {
    if (!confirm(`Are you sure you want to delete ${path}? This action cannot be undone.`)) return false;
    
    try {
      const response = await fetch(`${window.wpSynapseAILite.root}/delete-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.wpSynapseAILite.nonce
        },
        body: JSON.stringify({ path })
      });
      const result = await response.json();
      if (result.status === 'success') {
        // Remove from open files (including files inside if it's a folder)
        const updatedOpenFiles = openFiles.filter(f => !f.path.startsWith(path));
        setOpenFiles(updatedOpenFiles);
        
        if (activeFile && activeFile.path.startsWith(path)) {
            setActiveFile(null);
        }
        fetchFiles(rootPath);
        return true;
      } else {
        alert(result.message);
        return false;
      }
    } catch (err) {
      console.error("Failed to delete item", err);
      return false;
    }
  };

  const handleRenameItem = async (oldPath, newName) => {
    try {
      const response = await fetch(`${window.wpSynapseAILite.root}/rename-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.wpSynapseAILite.nonce
        },
        body: JSON.stringify({ path: oldPath, newName })
      });
      const result = await response.json();
      if (result.status === 'success') {
        // Update open files path if changed
        setOpenFiles(openFiles.map(f => f.path === oldPath ? { ...f, path: result.new_path, name: newName } : f));
        if (activeFile && activeFile.path === oldPath) {
            setActiveFile({ ...activeFile, path: result.new_path, name: newName });
        }
        fetchFiles(rootPath);
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error("Failed to rename item", err);
      return { success: false, message: "Network error" };
    }
  };

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isInitializing ? (
        <motion.div 
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="synapse-loader-screen"
        >
          <div className="synapse-loader-logo">
            <Zap size={64} className="pulse-zap" />
            <h1 className="loader-text">Synapse Lite Editor</h1>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`synapse-container lite-mode-ui ${isDarkMode ? 'dark-mode' : 'light-mode'} ${showSidebar ? 'sidebar-open' : ''}`} 
          style={{ cursor: isResizingSidebar ? 'col-resize' : 'default' }}
        >


          {/* Mobile Toggle Buttons */}
          <div className="mobile-toggles">
            <button onClick={() => setShowSidebar(!showSidebar)} className={`mobile-toggle-btn ${showSidebar ? 'active' : ''}`} title="File Explorer"><Code size={20} /></button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="mobile-toggle-btn" title="Toggle Theme">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Main Layout Area */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%', position: 'relative' }}>
              {/* Sidebar - File Explorer */}
              <aside className={`synapse-sidebar ${showSidebar ? 'visible' : 'hidden'}`} style={{ width: window.innerWidth > 768 ? sidebarWidth : '280px' }}>
                <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="sidebar-title"><Code size={16} /> SY-LITE</span>
                    <button 
                        onClick={() => setIsDarkMode(!isDarkMode)} 
                        className="theme-toggle"
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isDarkMode ? 'dark' : 'light'}
                                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex' }}
                            >
                                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                            </motion.div>
                        </AnimatePresence>
                    </button>
                  </div>
                  <select 
                    value={rootPath} 
                    onChange={(e) => setRootPath(e.target.value)}
                    style={{ fontSize: '0.7rem', padding: '2px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  >
                     <option value="">WP Root</option>
                     <option value="wp-content/themes">Themes</option>
                     <option value="wp-content/plugins">Plugins</option>
                  </select>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <FileTree 
                        files={files} 
                        onFileClick={handleFileClick} 
                        onCreateFile={handleCreateFile}
                        onCreateFolder={handleCreateFolder}
                        onDeleteItem={handleDeleteItem}
                        onRenameItem={handleRenameItem}
                        rootPath={rootPath}
                    />
                </div>
              </aside>

              {/* Resizer Sidebar */}
              {window.innerWidth > 768 && showSidebar && (
                <div 
                    className="resizer" 
                    onMouseDown={() => setIsResizingSidebar(true)}
                />
              )}

              {/* Main - Code Editor */}
              <main className="synapse-main">
                <CodeWorkspace 
                  activeFile={activeFile} 
                  openFiles={openFiles} 
                  setOpenFiles={setOpenFiles}
                  setActiveFile={setActiveFile}
                  isDarkMode={isDarkMode}
                />
              </main>
          </div>
          
          {/* Overlay for mobile when sidebars are open */}
          {showSidebar && window.innerWidth <= 768 && (
            <div className="mobile-overlay" onClick={() => { setShowSidebar(false); }} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
