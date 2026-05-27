import React, { useState, useEffect, useRef } from 'react';
import { Editor, DiffEditor } from '@monaco-editor/react';
import { X, Image as ImageIcon, ZoomIn, ZoomOut, GitCompare, Edit, Search, Sparkles, Wand2, MessageSquare, ChevronDown, CheckCircle, Loader2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { useFeatures } from './FeatureContext';

const CodeWorkspace = ({ activeFile, openFiles, setOpenFiles, setActiveFile, isDarkMode, editorFontSize, setEditorFontSize, isLoadingFile, onAISearch, onSelectionChange }) => {
  const { isEnabled } = useFeatures();
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [tabMenu, setTabMenu] = useState({ isOpen: false, x: 0, y: 0, file: null });
  const [selection, setSelection] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const editorRef = React.useRef(null);

  const closeFile = (e, file) => {
    if (e) e.stopPropagation();
    
    const performClose = () => {
      const newOpenFiles = openFiles.filter(f => f.path !== file.path);
      setOpenFiles(newOpenFiles);
      if (activeFile?.path === file.path) {
        setActiveFile(newOpenFiles[newOpenFiles.length - 1] || null);
      }
    };

    if (file.isDirty) {
      setModal({
        isOpen: true,
        title: 'Unsaved Changes',
        message: `The file "${file.name}" has unsaved changes. Are you sure you want to close it?`,
        type: 'warning',
        confirmText: 'Discard Changes & Close',
        onConfirm: performClose
      });
    } else {
      performClose();
    }
  };

  const closeAllFiles = () => {
    const dirtyFiles = openFiles.filter(f => f.isDirty);
    if (dirtyFiles.length > 0) {
      setModal({
        isOpen: true,
        title: 'Unsaved Changes',
        message: `You have ${dirtyFiles.length} files with unsaved changes. Are you sure you want to close everything?`,
        type: 'warning',
        confirmText: 'Close All',
        onConfirm: () => {
          setOpenFiles([]);
          setActiveFile(null);
        }
      });
    } else {
      setOpenFiles([]);
      setActiveFile(null);
    }
  };

  const copyFilePath = (file) => {
    if (!file) return;
    navigator.clipboard.writeText(file.path).then(() => {
        setModal({
            isOpen: true,
            title: 'Path Copied',
            message: `File path copied to clipboard: ${file.path}`,
            type: 'success',
            confirmText: 'Done'
        });
    });
  };

  const handleTabContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setTabMenu({ isOpen: true, x: e.clientX, y: e.clientY, file });
  };

  const getLanguage = (filename) => {
    if (!filename) return 'text';
    const ext = filename.split('.').pop();
    switch (ext) {
      case 'php': return 'php';
      case 'js':
      case 'jsx': return 'javascript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      default: return 'text';
    }
  };

  const monacoRef = React.useRef(null);

  const handleSave = async (editor) => {
    if (!activeFile) return;
    
    // Syntax Validation Check
    if (monacoRef.current) {
        const model = editor.getModel();
        const markers = monacoRef.current.editor.getModelMarkers({ resource: model.uri });
        
        // Severity 8 is Error in Monaco
        const errors = markers.filter(m => m.severity === 8);
        
        if (errors.length > 0) {
            const firstError = errors[0];
            setModal({
                isOpen: true,
                title: 'Syntax Error Detected',
                message: (
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ color: 'var(--error)', fontWeight: 600, marginBottom: '8px' }}>
                            Please fix the following error before saving:
                        </p>
                        <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '4px', fontSize: '0.85rem' }}>
                            <strong>Line {firstError.startLineNumber}:</strong> {firstError.message}
                        </div>
                    </div>
                ),
                type: 'error',
                confirmText: 'I will fix it'
            });
            return; // Stop the save process
        }
    }

    const content = editor.getValue();

    setModal({
        isOpen: true,
        title: 'Confirm Save',
        message: `Are you sure you want to save changes to ${activeFile.name}?`,
        type: 'info',
        confirmText: 'Save Changes',
        onConfirm: async () => {
            // Update local state first
            const updatedOpenFiles = openFiles.map(f => 
              f.path === activeFile.path ? { ...f, content, originalContent: content, isDirty: false } : f
            );
            setOpenFiles(updatedOpenFiles);
            setActiveFile({ ...activeFile, content, originalContent: content, isDirty: false });

            try {
              const response = await fetch(`${window.wpSynapseAI.root}/save-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
                body: JSON.stringify({ path: activeFile.path, content })
              });
              const data = await response.json();
              
              if (data.status === 'success') {
                  setModal({
                      isOpen: true,
                      title: 'Success!',
                      message: `Saved to: /${activeFile.path}`,
                      type: 'success'
                  });
              } else {
                  setModal({
                      isOpen: true,
                      title: 'Save Failed',
                      message: data.message || 'Unknown error occurred.',
                      type: 'error'
                  });
              }
            } catch (err) {
              setModal({
                  isOpen: true,
                  title: 'System Error',
                  message: 'Could not connect to server.',
                  type: 'error'
              });
            }
        }
    });
  };

    useEffect(() => {
        if (activeFile && activeFile.line && editorRef.current) {
            // Small timeout to ensure model is fully loaded and editor is ready
            setTimeout(() => {
                editorRef.current.revealLineInCenter(activeFile.line);
                editorRef.current.setPosition({ lineNumber: activeFile.line, column: 1 });
                editorRef.current.focus();
            }, 100);
        }
    }, [activeFile?.path, activeFile?.line]);

    useEffect(() => {
        const handleClick = () => {
            if (tabMenu.isOpen) setTabMenu({ ...tabMenu, isOpen: false });
        };
        if (tabMenu.isOpen) {
            window.addEventListener('click', handleClick);
            window.addEventListener('contextmenu', handleClick);
        }
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('contextmenu', handleClick);
        };
    }, [tabMenu.isOpen]);

  const handleEditorWillMount = (monaco) => {
    // Define Synapse Dark Theme
    monaco.editor.defineTheme('synapse-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
        { token: 'keyword', foreground: '6366f1', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#f8fafc',
        'editor.lineHighlightBackground': '#1e293b',
        'editorCursor.foreground': '#6366f1',
        'editor.selectionBackground': '#334155',
        'editor.inactiveSelectionBackground': '#334155',
        'editorBracketHighlight.foreground1': '#6366f1',
        'editorBracketHighlight.foreground2': '#a855f7',
        'editorBracketHighlight.foreground3': '#ec4899',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'diffEditor.insertedTextBackground': '#15803d55',
        'diffEditor.removedTextBackground': '#b91c1c55',
        'diffEditor.insertedLineBackground': '#15803d33',
        'diffEditor.removedLineBackground': '#b91c1c33',
        'diffEditor.insertedTextBorder': '#15803d',
        'diffEditor.removedTextBorder': '#b91c1c',
      }
    });

    // Define Synapse Light Theme
    monaco.editor.defineTheme('synapse-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '4f46e5', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#f8fafc',
        'editor.foreground': '#0f172a',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editorCursor.foreground': '#6366f1',
        'editor.selectionBackground': '#e2e8f0',
        'editor.inactiveSelectionBackground': '#e2e8f0',
        'editorBracketHighlight.foreground1': '#6366f1',
        'editorBracketHighlight.foreground2': '#a855f7',
        'editorBracketHighlight.foreground3': '#ec4899',
        'editorIndentGuide.background': '#e2e8f0',
        'editorIndentGuide.activeBackground': '#cbd5e1',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#475569',
        'diffEditor.insertedTextBackground': '#bbf7d0',
        'diffEditor.removedTextBackground': '#fecaca',
        'diffEditor.insertedLineBackground': '#f0fdf4',
        'diffEditor.removedLineBackground': '#fef2f2',
        'diffEditor.insertedTextBorder': '#16a34a',
        'diffEditor.removedTextBorder': '#dc2626',
      }
    });
  };

  const defaultOptions = {
    fontSize: editorFontSize,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
    fontLigatures: true,
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    'bracketPairColorization.enabled': true,
    'guides.bracketPairs': true,
    padding: { top: 16, bottom: 16 },
    renderWhitespace: 'selection',
    automaticLayout: true,
    mouseWheelZoom: true,
    roundedSelection: true,
    cursorBlinking: 'smooth',
  };

  const zoomIn = () => setEditorFontSize(prev => Math.min(prev + 1, 30));
  const zoomOut = () => setEditorFontSize(prev => Math.max(prev - 1, 8));

  const triggerFind = () => {
    if (editorRef.current) {
        editorRef.current.trigger('find-button', 'actions.find');
    }
  };

  const handleAIMenuAction = (provider, action) => {
    if (!selection || !activeFile) return;
    
    const prompt = action === 'review' 
        ? `Please review this code for improvements and security:\n\n${selection.text}`
        : `Please fix issues and optimize this code:\n\n${selection.text}`;
    
    navigator.clipboard.writeText(prompt).then(() => {
        const url = provider === 'ChatGPT' 
            ? 'https://chatgpt.com' 
            : 'https://gemini.google.com/app';
        
        window.open(url, '_blank');
        
        setIsAIModalOpen(false);
        
        setModal({
            isOpen: true,
            title: 'Code Copied!',
            message: `Your code and a ${action} prompt have been copied to the clipboard. Paste it into the ${provider} tab that just opened.`,
            type: 'success',
            confirmText: 'Got it'
        });
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Modal 
        {...modal} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
      <div className="editor-tabs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', overflowX: 'auto', flex: 1 }}>
            {openFiles.map(file => (
              <div 
                key={file.path}
                onClick={() => setActiveFile(file)}
                onContextMenu={(e) => handleTabContextMenu(e, file)}
                className={`editor-tab ${activeFile?.path === file.path ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                {file.isDirty && (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffca28' }} title="Unsaved changes" />
                )}
                <X 
                  size={12} 
                  className="close-tab"
                  onClick={(e) => closeFile(e, file)} 
                />
              </div>
            ))}
        </div>
        
        {/* Editor Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderLeft: '1px solid var(--border)' }}>
            {activeFile && !activeFile.isImage && (
                <button 
                    onClick={triggerFind}
                    className="header-action-btn"
                    title="Find (Ctrl+F)"
                >
                    <Search size={14} />
                </button>
            )}
            {activeFile && !activeFile.isImage && !activeFile.isDiff && isEnabled('diff_mode') && (
                <button 
                    onClick={() => setIsDiffMode(!isDiffMode)} 
                    className={`header-action-btn ${isDiffMode ? 'active' : ''}`}
                    title={isDiffMode ? "Back to Editor" : "Compare Changes"}
                    style={{ background: isDiffMode ? 'var(--accent)' : 'transparent', color: isDiffMode ? '#fff' : 'inherit' }}
                >
                    {isDiffMode ? <Edit size={14} /> : <GitCompare size={14} />}
                </button>
            )}

            {/* AI Search Button - Opens Modal */}
            {activeFile && !activeFile.isImage && selection && (
                <div className="ai-search-container">
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onAISearch(selection.text)} 
                        className="header-action-btn ai-search-btn"
                        title="AI Search & Review"
                        style={{ 
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
                            color: '#fff',
                            border: 'none',
                            width: 'auto',
                            padding: '0 12px',
                            gap: '6px',
                            height: '28px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Sparkles size={14} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>AI Search</span>
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={zoomOut} className="header-action-btn" title="Zoom Out Code"><ZoomOut size={14} /></button>
                <span style={{ fontSize: '0.7rem', opacity: 0.6, minWidth: '24px', textAlign: 'center' }}>{editorFontSize}</span>
                <button onClick={zoomIn} className="header-action-btn" title="Zoom In Code"><ZoomIn size={14} /></button>
            </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {isLoadingFile && (
            <div className="editor-loader-container">
                <Loader2 size={48} className="loader-icon" />
                <p style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>Opening File...</p>
            </div>
        )}
        
        {!isLoadingFile && activeFile ? (
          activeFile.isImage ? (
            <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '2rem',
                background: isDarkMode ? '#0f172a' : '#f1f5f9',
                overflowY: 'auto'
            }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        padding: '1.5rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        textAlign: 'center',
                        maxWidth: '90%'
                    }}
                >
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <img 
                            src={activeFile.url} 
                            alt={activeFile.name} 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '65vh', 
                                borderRadius: '8px',
                                display: 'block',
                                margin: '0 auto',
                                background: 'rgba(0,0,0,0.2)'
                            }} 
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div style={{ 
                            display: 'none', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '3rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px dashed var(--error)',
                            borderRadius: '8px',
                            color: 'var(--error)'
                        }}>
                            <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p style={{ fontWeight: 600 }}>Image could not be loaded</p>
                            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.8 }}>Check if the file is accessible at:<br/>{activeFile.url}</p>
                        </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '1rem' }}>{activeFile.name}</p>
                        <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', opacity: 0.8 }}>{activeFile.path}</p>
                    </div>
                </motion.div>
            </div>
          ) : activeFile.isDiff ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Reviewing Changes: <strong>{activeFile.name}</strong></span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => {
                                // Close the diff tab and go back to original
                                setOpenFiles(openFiles.filter(f => f.path !== activeFile.path));
                                setActiveFile(activeFile.originalFile || openFiles[0]);
                            }}
                            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 12px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                            Discard
                        </button>
                        <button 
                            onClick={() => {
                                if (!activeFile.originalFile) return;
                                const updatedFile = { ...activeFile.originalFile, content: activeFile.suggested_content, isDirty: true };
                                setOpenFiles(openFiles.map(f => f.path === updatedFile.path ? updatedFile : f).filter(f => f.path !== activeFile.path));
                                setActiveFile(updatedFile);
                            }}
                            style={{ background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Accept & Apply
                        </button>
                    </div>
                </div>
                <DiffEditor
                  key={`diff-${activeFile.path}-${editorFontSize}`}
                  height="100%"
                  theme={isDarkMode ? 'synapse-dark' : 'synapse-light'}
                  language={getLanguage(activeFile.name)}
                  original={activeFile.content}
                  modified={activeFile.suggested_content}
                  beforeMount={handleEditorWillMount}
                  options={{
                    ...defaultOptions,
                    readOnly: true,
                    renderSideBySide: true,
                  }}
                />
            </div>
          ) : isDiffMode ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Comparing: <strong>{activeFile.name}</strong> (Original vs Current)</span>
                </div>
                <DiffEditor
                  key={`user-diff-${activeFile.path}-${activeFile.isDirty}-${activeFile.content?.length}-${editorFontSize}`}
                  height="100%"
                  theme={isDarkMode ? 'synapse-dark' : 'synapse-light'}
                  language={getLanguage(activeFile.name)}
                  original={activeFile.originalContent || activeFile.content}
                  modified={activeFile.content}
                  beforeMount={handleEditorWillMount}
                  onMount={(editor) => {
                      // Synchronize current content if modified in diff mode (Monaco's diff editor allows editing 'modified' side)
                      editor.getModifiedEditor().onDidChangeModelContent(() => {
                          const val = editor.getModifiedEditor().getValue();
                          const updated = openFiles.map(f => f.path === activeFile.path ? { ...f, content: val, isDirty: true } : f);
                          setOpenFiles(updated);
                          setActiveFile(prev => ({ ...prev, content: val, isDirty: true }));
                      });
                  }}
                  options={{
                    ...defaultOptions,
                    renderSideBySide: true,
                  }}
                />
            </div>
          ) : (
            <Editor
              key={`${activeFile.path}-${editorFontSize}`}
              path={activeFile.path}
              height="100%"
              theme={isDarkMode ? 'synapse-dark' : 'synapse-light'}
              language={getLanguage(activeFile.name)}
              value={activeFile.content}
              beforeMount={handleEditorWillMount}
              onChange={(value) => {
                  const updated = openFiles.map(f => f.path === activeFile.path ? { ...f, content: value, isDirty: true } : f);
                  setOpenFiles(updated);
                  setActiveFile(prev => ({ ...prev, content: value, isDirty: true }));
              }}
              onMount={(editor, monaco) => {
                  monacoRef.current = monaco;
                  editorRef.current = editor;
                  
                  // Force hide IME textarea if it appears
                  const imeTextArea = editor.getDomNode().querySelector('.ime-text-area');
                  if (imeTextArea) {
                      imeTextArea.style.opacity = '0';
                      imeTextArea.style.pointerEvents = 'none';
                  }

                  // Create a context key to track dirty state in Monaco
                  const dirtyContextKey = editor.createContextKey('isFileDirty', false);
                  if (activeFile.isDirty) dirtyContextKey.set(true);
                  
                  // Update context key when state changes
                  editor.onDidChangeModelContent(() => {
                      dirtyContextKey.set(true);
                  });

                  // Initial jump to line if coming from search
                  if (activeFile.line) {
                      setTimeout(() => {
                          editor.revealLineInCenter(activeFile.line);
                          editor.setPosition({ lineNumber: activeFile.line, column: 1 });
                          editor.focus();
                      }, 100);
                  }

                  // Selection Tracking
                  editor.onDidChangeCursorSelection((e) => {
                      const model = editor.getModel();
                      const text = model.getValueInRange(e.selection);
                      if (text && text.trim().length > 0) {
                          const sel = {
                              text: text,
                              range: e.selection
                          };
                          setSelection(sel);
                          if (onSelectionChange) onSelectionChange(sel);
                      } else {
                          // Only clear if the menu isn't currently open
                          if (onSelectionChange) onSelectionChange(null);
                          setSelection(prev => {
                              if (prev && (document.activeElement.closest('.ai-search-container') || isAIModalOpen)) {
                                  return prev;
                              }
                              return null;
                          });
                      }
                  });

                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                     handleSave(editor);
                  });

                  // Add Undo to Context Menu
                  editor.addAction({
                      id: 'undo-action',
                      label: 'Undo',
                      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ],
                      contextMenuGroupId: 'navigation',
                      contextMenuOrder: 1,
                      run: () => editor.trigger('keyboard', 'undo', null)
                  });

                  // Add Redo to Context Menu
                  editor.addAction({
                      id: 'redo-action',
                      label: 'Redo',
                      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ],
                      contextMenuGroupId: 'navigation',
                      contextMenuOrder: 1.1,
                      run: () => editor.trigger('keyboard', 'redo', null)
                  });

                  // Add Save to Context Menu (Only when dirty)
                  editor.addAction({
                      id: 'save-file-action',
                      label: 'Save Changes',
                      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
                      precondition: 'isFileDirty',
                      contextMenuGroupId: 'navigation',
                      contextMenuOrder: 1.2,
                      run: () => {
                          handleSave(editor);
                          dirtyContextKey.set(false); // Reset after save
                      }
                  });
              }}
              loading={<div className="editor-loader-container"><Loader2 size={32} className="loader-icon" /></div>}
              options={defaultOptions}
            />
          )
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Select a file from the sidebar to start editing
          </div>
        )}
      </div>

      {/* AI Search Modal */}
      <Modal 
        isOpen={isAIModalOpen}
        title="AI Search & Review"
        onClose={() => setIsAIModalOpen(false)}
        type="info"
        customFooter={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Selected Code Snippet</div>
                <div style={{ 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    padding: '12px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap'
                }}>
                    {selection?.text}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10a37f', fontWeight: 700, fontSize: '0.9rem' }}>
                        ChatGPT
                    </div>
                    <button className="ai-modal-action-btn" onClick={() => handleAIMenuAction('ChatGPT', 'review')}>
                        <MessageSquare size={14} /> Review Code
                    </button>
                    <button className="ai-modal-action-btn" onClick={() => handleAIMenuAction('ChatGPT', 'fix')}>
                        <Wand2 size={14} /> Fix Issue
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4285f4', fontWeight: 700, fontSize: '0.9rem' }}>
                        Gemini
                    </div>
                    <button className="ai-modal-action-btn" onClick={() => handleAIMenuAction('Gemini', 'review')}>
                        <MessageSquare size={14} /> Review Code
                    </button>
                    <button className="ai-modal-action-btn" onClick={() => handleAIMenuAction('Gemini', 'fix')}>
                        <Wand2 size={14} /> Fix Issue
                    </button>
                </div>
            </div>

            <div style={{ 
                padding: '12px', 
                background: 'rgba(99, 102, 241, 0.1)', 
                border: '1px solid rgba(99, 102, 241, 0.2)', 
                borderRadius: '8px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
            }}>
                <Sparkles size={16} style={{ color: 'var(--accent)', marginTop: '2px' }} />
                <div style={{ fontSize: '0.75rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                    <strong>How it works:</strong> When you click an option, the code and prompt will be <strong>copied to your clipboard</strong> and the AI site will open in a new tab. Just press <strong>Ctrl+V (Paste)</strong> there!
                </div>
            </div>
        </div>
      </Modal>

      {tabMenu.isOpen && (
          <div 
            className="tab-context-menu"
            style={{
                position: 'fixed',
                top: tabMenu.y + 2,
                left: tabMenu.x + 2,
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                zIndex: 999999,
                padding: '6px 0',
                minWidth: '180px',
                display: 'block'
            }}
          >
              <div 
                className="menu-item" 
                onClick={(e) => { e.stopPropagation(); closeFile(null, tabMenu.file); setTabMenu({ ...tabMenu, isOpen: false }); }}
                style={{ padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}
              >
                  <X size={14} style={{ opacity: 0.7 }} /> Close Tab
              </div>
              <div 
                className="menu-item" 
                onClick={(e) => { e.stopPropagation(); closeAllFiles(); setTabMenu({ ...tabMenu, isOpen: false }); }}
                style={{ padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}
              >
                  <X size={14} style={{ opacity: 0.7 }} /> Close All Tabs
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />
              <div 
                className="menu-item" 
                onClick={(e) => { e.stopPropagation(); copyFilePath(tabMenu.file); setTabMenu({ ...tabMenu, isOpen: false }); }}
                style={{ padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}
              >
                  <Copy size={14} style={{ opacity: 0.7 }} /> Copy Full Path
              </div>
          </div>
      )}
    </div>
  );
};

export default CodeWorkspace;
