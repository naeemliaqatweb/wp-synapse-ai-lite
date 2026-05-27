import React, { useState, useEffect } from 'react';

const SettingsSkeleton = () => (
    <div style={{ padding: '20px', maxWidth: '850px', fontFamily: '"Inter", sans-serif', margin: '0 auto' }}>
        <div className="skeleton-box" style={{ width: '250px', height: '32px', marginBottom: '24px' }} />
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', height: '100px', marginBottom: '24px' }} className="skeleton-box" />
    </div>
);

const ToggleSwitch = ({ label, checked, onChange, isPro = false }) => (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '16px', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '12px',
        marginBottom: '12px',
        border: '1px solid var(--border)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
            {isPro && (
                <span style={{ 
                    fontSize: '0.65rem', 
                    background: 'var(--accent)', 
                    color: 'white', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontWeight: 700,
                    textTransform: 'uppercase'
                }}>Pro</span>
            )}
        </div>
        <label className="synapse-switch" style={{
            position: 'relative',
            display: 'inline-block',
            width: '44px',
            height: '24px'
        }}>
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={onChange}
                style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: checked ? 'var(--accent)' : '#334155',
                transition: '.4s',
                borderRadius: '24px',
                boxShadow: checked ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
            }}>
                <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%',
                    transform: checked ? 'translateX(20px)' : 'translateX(0)'
                }} />
            </span>
        </label>
    </div>
);

function SettingsApp() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('free');
    const [settings, setSettings] = useState({
        dev_mode: true,
        is_premium: false,
        features: {},
        ai_api_key: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${wpSynapseAI.root}/settings`, {
                headers: { 'X-WP-Nonce': wpSynapseAI.nonce }
            });
            const data = await response.json();
            setSettings(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            setLoading(false);
        }
    };

    const handleSave = async (updatedSettings) => {
        setSaving(true);
        try {
            await fetch(`${wpSynapseAI.root}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': wpSynapseAI.nonce
                },
                body: JSON.stringify(updatedSettings)
            });
            setSettings(updatedSettings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
        setSaving(false);
    };

    const toggleFeature = (feature) => {
        const updatedFeatures = { ...settings.features, [feature]: !settings.features[feature] };
        handleSave({ ...settings, features: updatedFeatures });
    };

    if (loading) return <SettingsSkeleton />;

    return (
        <div style={{ padding: '40px 20px', maxWidth: '850px', fontFamily: '"Inter", sans-serif', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff', letterSpacing: '-1px' }}>
                        Synapse <span style={{ color: 'var(--accent)' }}>Pro</span> Settings
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Configure your professional IDE experience.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                     <button 
                        onClick={() => handleSave({ ...settings, dev_mode: !settings.dev_mode })}
                        style={{ 
                            padding: '8px 16px', 
                            background: settings.dev_mode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: settings.dev_mode ? 'var(--success)' : 'var(--text-secondary)',
                            border: `1px solid ${settings.dev_mode ? 'var(--success)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {settings.dev_mode ? 'Dev Mode: ON' : 'Dev Mode: OFF'}
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
                <button 
                    onClick={() => setActiveTab('free')}
                    style={{ 
                        padding: '12px 4px', 
                        background: 'none', 
                        border: 'none', 
                        borderBottom: activeTab === 'free' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'free' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Free Features
                </button>
                <button 
                    onClick={() => setActiveTab('pro')}
                    style={{ 
                        padding: '12px 4px', 
                        background: 'none', 
                        border: 'none', 
                        borderBottom: activeTab === 'pro' ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === 'pro' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Premium Features
                </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border)', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                {activeTab === 'free' ? (
                    <div>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem' }}>Core IDE Components</h3>
                        <ToggleSwitch label="Monaco Editor (VS Code Core)" checked={settings.features.monaco_editor} onChange={() => toggleFeature('monaco_editor')} />
                        <ToggleSwitch label="Basic File Manager" checked={settings.features.file_manager} onChange={() => toggleFeature('file_manager')} />
                        <ToggleSwitch label="Simple File Search" checked={settings.features.basic_search} onChange={() => toggleFeature('basic_search')} />
                        <ToggleSwitch label="Light/Dark Mode Toggle" checked={settings.features.theme_toggle} onChange={() => toggleFeature('theme_toggle')} />
                        <ToggleSwitch label="Basic File Uploads" checked={settings.features.uploads} onChange={() => toggleFeature('uploads')} />
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Pro Power Tools</h3>
                            {!settings.is_premium && !settings.dev_mode && (
                                <button style={{ 
                                    padding: '6px 12px', 
                                    background: 'var(--accent)', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}>Unlock All</button>
                            )}
                        </div>
                        <ToggleSwitch label="Global Grep Search" checked={settings.features.grep_search} onChange={() => toggleFeature('grep_search')} isPro />
                        <ToggleSwitch label="Visual Diff Mode" checked={settings.features.diff_mode} onChange={() => toggleFeature('diff_mode')} isPro />
                        <ToggleSwitch label="ZIP Backup & Extract" checked={settings.features.zip_tools} onChange={() => toggleFeature('zip_tools')} isPro />
                        <ToggleSwitch label="Persistent Workspaces & Tabs" checked={settings.features.persistent_tabs} onChange={() => toggleFeature('persistent_tabs')} isPro />
                        <ToggleSwitch label="AI Code Assistant (Chat)" checked={settings.features.ai_chat} onChange={() => toggleFeature('ai_chat')} isPro />
                        <ToggleSwitch label="Vector File Indexing" checked={settings.features.vector_search} onChange={() => toggleFeature('vector_search')} isPro />
                        <ToggleSwitch label="Terminal / Shell Access" checked={settings.features.terminal} onChange={() => toggleFeature('terminal')} isPro />

                        <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>AI Configuration</h3>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Gemini API Key</label>
                                <input 
                                    type="password" 
                                    value={settings.ai_api_key} 
                                    onChange={(e) => handleSave({ ...settings, ai_api_key: e.target.value })}
                                    placeholder="Enter your Gemini API Key"
                                    style={{
                                        width: '100%',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>AI Model</label>
                                <select 
                                    value={settings.ai_model} 
                                    onChange={(e) => handleSave({ ...settings, ai_model: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        padding: '10px 12px',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
                                    <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {saving && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'var(--accent)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 10px 20px rgba(0,0,0,0.2)', animation: 'fadeIn 0.3s' }}>
                    Saving changes...
                </div>
            )}
        </div>
    );
}

export default SettingsApp;
