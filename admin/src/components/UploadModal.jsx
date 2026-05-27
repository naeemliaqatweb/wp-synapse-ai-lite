import React, { useState, useRef } from 'react';
import { X, Upload, File, Trash2, CheckCircle2, AlertCircle, Loader2, Folder, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UploadModal = ({ isOpen, onClose, targetPath, onUpload, isDarkMode }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null); // { success: [], errors: [] }
    const fileInputRef = useRef(null);

    const [fixingPermissions, setFixingPermissions] = useState(false);
    const dropZoneRef = useRef(null);

    // Reset results when modal opens or target changes
    React.useEffect(() => {
        if (isOpen) {
            setResults(null);
            // We keep selectedFiles so user doesn't have to re-select
        }
    }, [isOpen, targetPath]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFixPermissions = async () => {
        setFixingPermissions(true);
        try {
            const response = await fetch(`${window.wpSynapseAI.root}/fix-permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAI.nonce },
                body: JSON.stringify({ path: targetPath, mode: 'allow' })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setResults(null);
                setSelectedFiles([]);
                alert('Permissions fixed! You can now try uploading again.');
            } else {
                alert('Failed to fix permissions: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            alert('Network error while fixing permissions.');
        } finally {
            setFixingPermissions(false);
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setUploading(true);
        setResults(null);

        const success = [];
        const errors = [];

        for (const file of selectedFiles) {
            const result = await onUpload(targetPath, file);
            if (result.success) {
                success.push(file.name);
            } else {
                errors.push({ name: file.name, message: result.message });
            }
        }

        setResults({ success, errors });
        setUploading(false);
        if (errors.length === 0) {
            setSelectedFiles([]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    return (
        <div className="modal-overlay">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="modal-container"
                style={{ maxWidth: '500px' }}
            >
                <div className="modal-header" style={{ backgroundColor: 'var(--accent)', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
                            <Upload size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Upload Files</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '2px' }}>
                                <Folder size={10} />
                                <span>Destination: </span>
                                <span style={{ color: '#fff', fontWeight: 600 }}>{targetPath || 'Root'}</span>
                            </div>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} disabled={uploading} style={{ color: '#fff' }}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    {!results && (
                        <>
                            <div 
                                className="upload-dropzone"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: '12px',
                                    padding: '2rem 1rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    backgroundColor: 'rgba(15, 23, 42, 0.2)'
                                }}
                            >
                                <input 
                                    type="file" 
                                    multiple 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    onChange={handleFileChange} 
                                />
                                <Upload size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px', opacity: 0.5 }} />
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    Drag & drop files here or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Browse</span>
                                </p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    Multiple files supported
                                </p>
                            </div>

                            {selectedFiles.length > 0 && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Selected Files ({selectedFiles.length})
                                    </h4>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                                        {selectedFiles.map((file, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderBottom: i === selectedFiles.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                                <File size={14} style={{ color: 'var(--text-secondary)' }} />
                                                <span style={{ flex: 1, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</span>
                                                <button 
                                                    onClick={() => removeFile(i)}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', borderRadius: '4px' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {results && (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            {results.errors.length === 0 ? (
                                <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
                            ) : (
                                <AlertCircle size={48} style={{ color: 'var(--error)', marginBottom: '1rem' }} />
                            )}
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                {results.errors.length === 0 ? 'Upload Successful' : 'Upload Finished with Errors'}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                {results.success.length} files uploaded successfully.
                            </p>

                            {results.errors.length > 0 && (
                                <div style={{ textAlign: 'left', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '8px', padding: '10px', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--error)', marginBottom: '6px' }}>Failed uploads:</p>
                                    {results.errors.map((err, i) => (
                                        <div key={i} style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: i === results.errors.length - 1 ? 0 : '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{err.name}</span>
                                                <span style={{ opacity: 0.7 }}>{err.message}</span>
                                            </div>
                                            {err.message.includes('not writable') && (
                                                <button 
                                                    onClick={handleFixPermissions}
                                                    disabled={fixingPermissions}
                                                    style={{ 
                                                        alignSelf: 'flex-start',
                                                        background: 'var(--error)', 
                                                        color: 'white', 
                                                        border: 'none', 
                                                        padding: '4px 8px', 
                                                        borderRadius: '4px', 
                                                        fontSize: '0.65rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        marginTop: '2px'
                                                    }}
                                                >
                                                    {fixingPermissions ? <Loader2 size={10} className="animate-spin" /> : <ShieldAlert size={10} />}
                                                    {fixingPermissions ? 'Fixing...' : 'Fix Permissions for this Directory'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {!results ? (
                        <>
                            <button className="synapse-btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }} onClick={onClose} disabled={uploading}>
                                Cancel
                            </button>
                            <button 
                                className="synapse-btn" 
                                onClick={handleUpload} 
                                disabled={uploading || selectedFiles.length === 0}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                {uploading ? 'Uploading...' : 'Start Upload'}
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {results.errors.length > 0 && (
                                <button className="synapse-btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }} onClick={() => setResults(null)}>
                                    Try Again / Edit Files
                                </button>
                            )}
                            <button className="synapse-btn" onClick={onClose}>
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default UploadModal;
