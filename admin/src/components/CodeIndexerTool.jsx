import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Check, AlertCircle, Loader2, Home, Layers } from 'lucide-react';

const CodeIndexerTool = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/index-status`, {
        headers: { 'X-WP-Nonce': window.wpSynapseAI.nonce }
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch index status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReIndex = async () => {
    setRefreshing(true);
    setMessage(null);
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/re-index`, {
        method: 'POST',
        headers: { 'X-WP-Nonce': window.wpSynapseAI.nonce }
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Theme successfully re-indexed.' });
        await fetchStatus();
      } else {
        setMessage({ type: 'error', text: 'Failed to refresh index.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setRefreshing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading && !status) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Loader2 className="animate-spin" style={{ color: '#6366f1' }} />
      </div>
    );
  }

  return (
    <div style={{ color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {status?.theme?.is_child ? <Layers size={18} style={{ color: '#818cf8' }} /> : <Home size={18} style={{ color: '#818cf8' }} />}
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{status?.theme?.name || 'Loading...'}</span>
            {status?.theme?.is_child && <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(129, 140, 248, 0.2)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Child Theme</span>}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Path: <code style={{ backgroundColor: '#0f172a', padding: '2px 4px', borderRadius: '4px' }}>/{status?.theme?.path}</code>
          </p>
        </div>
        <button 
          onClick={handleReIndex} 
          disabled={refreshing}
          style={{ 
            backgroundColor: '#6366f1', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            opacity: refreshing ? 0.7 : 1
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
        >
          {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh Index
        </button>
      </div>

      {status?.parent && (
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
            <Home size={14} />
            <span>Inheriting from Parent: <strong>{status.parent.name}</strong></span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Files Scanned</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{status?.files_scanned}</div>
        </div>
        <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Functions</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{status?.functions_count}</div>
        </div>
        <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Classes/Traits</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{status?.classes_count}</div>
        </div>
      </div>

      {message && (
        <div style={{ 
          marginTop: '16px', 
          padding: '10px 14px', 
          borderRadius: '8px', 
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
        }}>
          {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div style={{ marginTop: '24px', padding: '12px', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '10px', border: '1px dashed rgba(99, 102, 241, 0.2)' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.5' }}>
          <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          The indexer helps the AI detect existing functions to prevent "Already declared" errors. 
          The index is cached for 1 hour but refreshes automatically when you apply changes through the agent.
        </p>
      </div>
    </div>
  );
};

export default CodeIndexerTool;
