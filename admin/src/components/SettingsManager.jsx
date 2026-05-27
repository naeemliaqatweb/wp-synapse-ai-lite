import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, HelpCircle, Sparkles, AlertCircle, CheckCircle, RefreshCw, Zap, Rocket, FolderOpen, Code, GitCompare, Sun, Search, Upload, Plus, Copy, Move, Archive, Settings, Star, Lock, Save } from 'lucide-react';
import { useFeatures } from './FeatureContext';

const SettingsManager = ({ isDarkMode }) => {
  const { settings, refreshSettings } = useFeatures();
  const [activeTab, setActiveTab] = useState('permissions');
  const [isFixing, setIsFixing] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState(null);

  useEffect(() => {
    if (settings) setLocalSettings(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  const tabs = [
    { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
    { id: 'free_features', label: 'Free Features', icon: Settings },
    { id: 'pro_features', label: 'Premium Features', icon: Star },
    { id: 'howtouse', label: 'How to Use', icon: HelpCircle },
  ];

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.wpSynapseAI.nonce
        },
        body: JSON.stringify(localSettings)
      });
      const data = await response.json();
      if (data.status === 'success') {
        refreshSettings();
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleFeature = (feature) => {
    setLocalSettings(prev => ({
        ...prev,
        features: {
            ...prev.features,
            [feature]: !prev.features[feature]
        }
    }));
  };

  const ToggleSwitch = ({ label, checked, onChange, isPro = false }) => {
    const isDisabled = isPro && !localSettings?.is_premium && !localSettings?.dev_mode;
    return (
      <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '16px', 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '12px', 
          marginBottom: '12px',
          border: '1px solid var(--border)',
          opacity: isDisabled ? 0.65 : 1
      }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
              {isPro && <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>PRO</span>}
          </div>
          <button 
              onClick={isDisabled ? () => { window.open(window.wpSynapseAI?.upgradeUrl, '_top'); } : onChange}
              style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: checked && !isDisabled ? 'var(--accent)' : 'var(--bg-tertiary)',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
              }}
          >
              <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '3px',
                  left: checked && !isDisabled ? '23px' : '3px',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
          </button>
      </div>
    );
  };

  const renderFeatureSection = (type) => {
    const isProTab = type === 'pro';
    if (!localSettings) return null;

    return (
        <div className="settings-content-fade">
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                        {isProTab ? 'Premium Features' : 'Core Components'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        {isProTab ? 'Unlock advanced AI tools and professional development utilities.' : 'Manage the basic IDE features available in the Lite version.'}
                    </p>
                </div>
                <button 
                    className="synapse-btn" 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    style={{ 
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
                        padding: '12px 32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Settings
                </button>
            </div>

            {isProTab && !localSettings.is_premium && !localSettings.dev_mode && (
                <div style={{ 
                    padding: '24px', 
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div style={{ background: 'var(--accent)', padding: '12px', borderRadius: '12px', color: 'white' }}>
                        <Lock size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Premium License Required</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>These features are currently locked. Upgrade to Pro to enable them.</p>
                    </div>
                    <a 
                        href={window.wpSynapseAI?.upgradeUrl || '#'} 
                        target="_top" 
                        className="synapse-btn" 
                        style={{ 
                            background: 'var(--accent)', 
                            textDecoration: 'none', 
                            display: 'inline-flex', 
                            alignItems: 'center' 
                        }}
                    >
                        Upgrade Now
                    </a>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                {!isProTab ? (
                    <>
                        <ToggleSwitch label="Monaco Editor (VS Code)" checked={localSettings.features.monaco_editor} onChange={() => toggleFeature('monaco_editor')} />
                        <ToggleSwitch label="File Explorer" checked={localSettings.features.file_manager} onChange={() => toggleFeature('file_manager')} />
                        <ToggleSwitch label="Basic Search" checked={localSettings.features.basic_search} onChange={() => toggleFeature('basic_search')} />
                        <ToggleSwitch label="Theme Toggle" checked={localSettings.features.theme_toggle} onChange={() => toggleFeature('theme_toggle')} />
                        <ToggleSwitch label="File Uploads" checked={localSettings.features.uploads} onChange={() => toggleFeature('uploads')} />
                    </>
                ) : (
                    <>
                        <ToggleSwitch label="Global Grep Search" checked={localSettings.features.grep_search} onChange={() => toggleFeature('grep_search')} isPro />
                        <ToggleSwitch label="Diff / Review Mode" checked={localSettings.features.diff_mode} onChange={() => toggleFeature('diff_mode')} isPro />
                        <ToggleSwitch label="ZIP Tools (Compress/Extract)" checked={localSettings.features.zip_tools} onChange={() => toggleFeature('zip_tools')} isPro />
                        <ToggleSwitch label="AI Code Assistant (Chat)" checked={localSettings.features.ai_chat} onChange={() => toggleFeature('ai_chat')} isPro />
                        <ToggleSwitch label="Vector Code Indexing" checked={localSettings.features.vector_search} onChange={() => toggleFeature('vector_search')} isPro />
                        <ToggleSwitch label="Terminal / Shell" checked={localSettings.features.terminal} onChange={() => toggleFeature('terminal')} isPro />
                    </>
                )}
            </div>
            
            {isProTab && (
                <div style={{ marginTop: '40px', padding: '32px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>AI Configuration</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Gemini API Key</label>
                            <input 
                                type="password" 
                                value={localSettings.ai_api_key} 
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, ai_api_key: e.target.value }))}
                                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0px 22px', color: 'rgb(255, 255, 255)', height: '40px' }}
                                placeholder="Enter API Key"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Model</label>
                            <select 
                                value={localSettings.ai_model} 
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, ai_model: e.target.value }))}
                                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0px 22px', color: 'rgb(255, 255, 255)', height: '40px' }}
                            >
                                <option value="gemini-flash-latest">Gemini Flash (Latest - Recommended)</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fastest)</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Stable)</option>
                                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Stable)</option>
                                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Latest)</option>
                                <option value="gemini-pro">Gemini Pro (Legacy)</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const handleFixPermissions = async (path, mode) => {
    setIsFixing(true);
    setMessage(null);
    try {
      const response = await fetch(`${window.wpSynapseAI.root}/fix-permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.wpSynapseAI.nonce
        },
        body: JSON.stringify({ path, mode })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update permissions' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsFixing(false);
    }
  };

  const renderPermissions = () => (
    <div className="settings-content-fade">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Permissions Manager</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', maxWidth: '700px' }}>
          Resolve file write permission issues for seamless theme and plugin development. 
          Granting write access allows the editor to save your changes directly to the server.
        </p>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            padding: '16px 20px', 
            borderRadius: '12px', 
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: message.type === 'success' ? '#10b981' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{message.text}</span>
        </motion.div>
      )}

      <div style={{ display: 'grid', gap: '16px', maxWidth: '800px' }}>
        {[
          { name: 'Themes', path: 'wp-content/themes' },
          { name: 'Plugins', path: 'wp-content/plugins' }
        ].map((item) => (
          <div key={item.name} style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border)', 
            borderRadius: '16px', 
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease'
          }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h3>
              <code style={{ fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                {item.path}
              </code>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="synapse-btn secondary"
                onClick={() => handleFixPermissions(item.path, 'revert')}
                disabled={isFixing}
                style={{ fontSize: '0.85rem' }}
              >
                Secure Folder
              </button>
              <button 
                className="synapse-btn"
                onClick={() => handleFixPermissions(item.path, 'allow')}
                disabled={isFixing}
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', fontSize: '0.85rem' }}
              >
                Grant Write Access
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHowToUse = () => (
    <div className="settings-content-fade">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Feature Guide</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>Unlock the full potential of WP Synapse AI with these powerful features.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {[
          { title: 'Advanced Code Search', text: 'Scan deep into file contents to find hooks, functions, or variables. Click snippets to jump directly to any line.', icon: Search },
          { title: 'AI Code Review', text: 'Select code to get expert reviews or bug fixes from ChatGPT and Gemini.', icon: Sparkles },
          { title: 'Compare Changes', text: 'Use Diff Mode to see exactly what you changed before saving your code.', icon: GitCompare },
          { title: 'File Management', text: 'Create, rename, duplicate, and move files or folders with a simple right-click.', icon: Plus },
          { title: 'Smart Uploads', text: 'Upload files directly to any directory in your themes or plugins folder.', icon: Upload },
          { title: 'ZIP Compression', text: 'Compress folders to ZIP or extract archives directly on your server.', icon: Archive },
          { title: 'Drag & Drop', text: 'Reorganize your project structure by dragging files into new folders.', icon: Move },
          { title: 'Dark/Light Mode', text: 'Switch between sleek Dark Mode and high-contrast Light Mode for your comfort.', icon: Sun }
        ].map((item, i) => (
          <div key={i} style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ color: 'var(--accent)', marginBottom: '16px' }}><item.icon size={24} /></div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUpcoming = () => (
    <div className="settings-content-fade" style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
        padding: '60px 40px',
        borderRadius: '32px',
        border: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}><Rocket size={150} /></div>
        
        <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '20px', color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '1px' }}>
          PRO VERSION COMING SOON
        </div>
        
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '-1px', color: 'var(--text-primary)' }}>Level Up Your Workflow</h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '40px' }}>
            We're building an autonomous AI coding agent that will transform how you develop on WordPress. 
            Imagine a collaborative partner that understands your entire codebase.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left', marginBottom: '40px' }}>
            {[
                { title: 'Interactive AI Chat', desc: 'Directly prompt the AI to explain, refactor, or debug your code.' },
                { title: 'Automated Code Review', desc: 'Instant feedback on security, performance, and WP best practices.' },
                { title: 'Smart Code Patching', desc: 'One-click fixes and updates applied directly at the code level.' },
                { title: 'Neural Optimization', desc: 'AI-driven suggestions to make your site faster and more efficient.' }
            ].map(f => (
                <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>
                        <CheckCircle size={16} color="#10b981" /> {f.title}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: '1.5' }}>{f.desc}</p>
                </div>
            ))}
        </div>

        <button className="synapse-btn" style={{ padding: '16px 40px', fontSize: '1rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
          Notify Me on Release
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', overflowY: 'auto' }}>
      <div style={{ padding: '40px 60px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '40px', marginBottom: '40px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMessage(null); }}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 0',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeSettingsTab" 
                  style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--accent)' }} 
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'permissions' && renderPermissions()}
            {activeTab === 'free_features' && renderFeatureSection('free')}
            {activeTab === 'pro_features' && renderFeatureSection('pro')}
            {activeTab === 'howtouse' && renderHowToUse()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsManager;
