import React, { useState } from 'react';
import { Editor, DiffEditor } from '@monaco-editor/react';
import { X } from 'lucide-react';
import Modal from './Modal';

const CodeWorkspace = ({ activeFile, openFiles, setOpenFiles, setActiveFile, isDarkMode }) => {
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  const closeFile = (e, file) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(f => f.path !== file.path);
    setOpenFiles(newOpenFiles);
    if (activeFile?.path === file.path) {
      setActiveFile(newOpenFiles[newOpenFiles.length - 1] || null);
    }
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

  const handleSave = async (editor) => {
    if (!activeFile) return;
    
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
              f.path === activeFile.path ? { ...f, content, isDirty: false } : f
            );
            setOpenFiles(updatedOpenFiles);
            setActiveFile({ ...activeFile, content, isDirty: false });

            try {
              const response = await fetch(`${window.wpSynapseAILite.root}/save-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAILite.nonce },
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

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Modal 
        {...modal} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
      <div className="editor-tabs">
        {openFiles.map(file => (
          <div 
            key={file.path}
            onClick={() => setActiveFile(file)}
            className={`editor-tab ${activeFile?.path === file.path ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
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

      <div style={{ flex: 1 }}>
        {activeFile ? (
          activeFile.isDiff ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Reviewing Changes: <strong>{activeFile.name}</strong></span>
                </div>
                <DiffEditor
                  key={`diff-${activeFile.path}-${activeFile.suggested_content?.length || 0}`}
                  height="100%"
                  theme={isDarkMode ? 'vs-dark' : 'light'}
                  language={getLanguage(activeFile.name)}
                  original={activeFile.content}
                  modified={activeFile.suggested_content}
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    readOnly: true,
                    renderSideBySide: true,
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace"
                  }}
                />
            </div>
          ) : (
            <Editor
              key={`${activeFile.path}-${activeFile.content?.length || 0}`}
              path={activeFile.path}
              height="100%"
              theme={isDarkMode ? 'vs-dark' : 'light'}
              language={getLanguage(activeFile.name)}
              value={activeFile.content}
              onChange={(value) => {
                  if (activeFile && !activeFile.isDirty) {
                      const updated = openFiles.map(f => f.path === activeFile.path ? { ...f, isDirty: true } : f);
                      setOpenFiles(updated);
                      setActiveFile(prev => ({ ...prev, isDirty: true }));
                  }
              }}
              onMount={(editor, monaco) => {
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                     handleSave(editor);
                  });
              }}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 10 },
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true
              }}
            />
          )
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            Select a file to start editing
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeWorkspace;
