import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, ShieldOff, Folder, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PermissionsTool = () => {
    const [baseDir, setBaseDir] = useState('wp-content/themes');
    const [subDirs, setSubDirs] = useState([]);
    const [selectedDir, setSelectedDir] = useState('');
    
    const [loadingSubDirs, setLoadingSubDirs] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        fetchSubDirs(baseDir);
    }, [baseDir]);

    const fetchSubDirs = async (dir) => {
        setLoadingSubDirs(true);
        try {
            const response = await fetch(`${window.wpSynapseAILite.root}/files?path=${dir}`, {
                headers: { 'X-WP-Nonce': window.wpSynapseAILite.nonce }
            });
            const data = await response.json();
            const directories = data.filter(item => item.type === 'directory');
            setSubDirs(directories);
            if (directories.length > 0) {
                setSelectedDir(directories[0].name);
            } else {
                setSelectedDir('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSubDirs(false);
        }
    };

    const handlePermission = async (mode) => {
        if (!selectedDir) {
            setStatus({ type: 'error', message: 'Please select a directory.' });
            return;
        }

        setLoading(true);
        setStatus(null);
        
        const targetPath = `${baseDir}/${selectedDir}`;

        try {
            const response = await fetch(`${window.wpSynapseAILite.root}/fix-permissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.wpSynapseAILite.nonce },
                body: JSON.stringify({ path: targetPath, mode })
            });
            const data = await response.json();
            
            if (data.status === 'success') {
                setStatus({ type: 'success', message: data.message });
            } else {
                setStatus({ type: 'error', message: data.message || 'Operation failed.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to contact the server.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '8px' }}>How AI Permissions Work:</strong>
                If you want the AI to modify or create files automatically during the <em>Review & Execute</em> phase, the system needs write access. 
                Before running the AI, select your active plugin or theme and click <strong>Allow AI Write</strong>. 
                Once the AI has finished its task, you should immediately secure your server by clicking <strong>Revert Permissions</strong>.
            </div>

            <div style={{ display: 'flex', gap: '16px', backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><Folder size={14}/> Base Directory</label>
                    <select 
                        className="synapse-select"
                        value={baseDir}
                        onChange={(e) => setBaseDir(e.target.value)}
                        style={{ padding: '10px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '0.85rem' }}
                    >
                        <option value="wp-content/themes">Themes (wp-content/themes)</option>
                        <option value="wp-content/plugins">Plugins (wp-content/plugins)</option>
                    </select>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}><Cpu size={14}/> Target Add-on</label>
                    <select 
                        className="synapse-select"
                        value={selectedDir}
                        onChange={(e) => setSelectedDir(e.target.value)}
                        disabled={loadingSubDirs || subDirs.length === 0}
                        style={{ padding: '10px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '0.85rem', opacity: loadingSubDirs ? 0.5 : 1 }}
                    >
                        {loadingSubDirs ? <option>Loading...</option> : 
                            subDirs.length === 0 ? <option>No directories found</option> :
                            subDirs.map(dir => (
                                <option key={dir.name} value={dir.name}>{dir.name}</option>
                            ))
                        }
                    </select>
                </div>
            </div>
            
            <AnimatePresence>
                {status && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        style={{ 
                            fontSize: '0.85rem', padding: '12px 16px', borderRadius: '8px', 
                            backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: status.type === 'success' ? '#34d399' : '#f87171',
                            border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            display: 'flex', alignItems: 'center', gap: '12px'
                        }}
                    >
                        {status.type === 'success' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                        <span style={{flex: 1}}>{status.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                    onClick={() => handlePermission('allow')}
                    disabled={loading || !selectedDir}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', opacity: loading ? 0.7 : 1 }}
                >
                    <ShieldAlert size={16} /> Allow AI Write (0777)
                </button>
                <button 
                    onClick={() => handlePermission('revert')}
                    disabled={loading || !selectedDir}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', opacity: loading ? 0.7 : 1 }}
                >
                    <ShieldOff size={16} /> Revert Permissions (0755)
                </button>
            </div>
        </div>
    );
};

export default PermissionsTool;
