import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Sparkles, Code, RefreshCw, CheckCircle, FileText, X, GitCompare, HelpCircle, ShieldAlert, Zap, ChevronDown, PenTool, MessageSquare, History, Calendar, Trash2, AlertCircle, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeatures } from './FeatureContext';
import { getStorageItem, setStorageItem, removeStorageItem } from '../utils/storage';
import { getFileIcon } from '../utils/icons';

const Markdown = ({ content }) => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    const lines = part.split('\n');
                    const firstLine = lines[0];
                    const language = firstLine.replace('```', '').trim() || 'code';
                    const code = lines.slice(1, -1).join('\n');
                    return (
                        <div key={index} style={{ background: '#0D1117', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', margin: '8px 0' }}>
                            <div style={{ background: '#161B22', padding: '6px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>{language}</span>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(code)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Copy
                                </button>
                            </div>
                            <pre style={{ margin: 0, padding: '12px', overflowX: 'auto', fontSize: '0.75rem', fontFamily: 'monospace', color: '#E6EDF0' }}>
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                } else {
                    return (
                        <span key={index} style={{ display: 'block', lineHeight: '1.6' }}>
                            {part.split('\n').map((line, lineIdx) => {
                                const regex = /(\*\*.*?\*\*|`.*?`)/g;
                                const subparts = line.split(regex);
                                return (
                                    <React.Fragment key={lineIdx}>
                                        {subparts.map((subpart, subIdx) => {
                                            if (subpart.startsWith('**') && subpart.endsWith('**')) {
                                                return <strong key={subIdx} style={{ color: '#fff', fontWeight: 700 }}>{subpart.slice(2, -2)}</strong>;
                                            } else if (subpart.startsWith('`') && subpart.endsWith('`')) {
                                                return <code key={subIdx} style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent)', border: '1px solid var(--border)' }}>{subpart.slice(1, -1)}</code>;
                                            }
                                            return subpart;
                                        })}
                                        {lineIdx < part.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                );
                            })}
                        </span>
                    );
                }
            })}
        </div>
    );
};

const AIChat = ({ activeFile, onFileClick, onClose, onApplyCode, onReviewCode, pendingPrompt, onPromptConsumed }) => {
    const { settings } = useFeatures();
    const [chatMode, setChatMode] = useState('chat'); // 'chat' or 'write'
    
    // Separate message states for Chat and Write modes
    const [chatMessages, setChatMessages] = useState(() => {
        const saved = getStorageItem('chat_history_chat');
        return saved ? JSON.parse(saved) : [
            { id: 1, role: 'assistant', content: 'Hello! I am your Synapse Chat Assistant. How can I help you today?', date: new Date().toISOString() }
        ];
    });

    const [writeMessages, setWriteMessages] = useState(() => {
        const saved = getStorageItem('chat_history_write');
        return saved ? JSON.parse(saved) : [
            { id: 1, role: 'assistant', content: 'Ready to write code. Tell me what you want to build or modify in the active file.', date: new Date().toISOString() }
        ];
    });

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [selectedModel, setSelectedModel] = useState(() => {
        return getStorageItem('active_model') || settings.ai_model || 'gemini-2.0-flash';
    });
    const [showModelMenu, setShowModelMenu] = useState(false);
    const scrollRef = useRef(null);
    const abortControllerRef = useRef(null);

    const models = [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Recommended)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ];

    // Current active messages based on mode
    const currentMessages = chatMode === 'chat' ? chatMessages : writeMessages;
    const setCurrentMessages = chatMode === 'chat' ? setChatMessages : setWriteMessages;

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsTyping(false);
            setCurrentMessages(prev => [...prev, { 
                id: Date.now(), 
                role: 'assistant', 
                content: 'Response generation stopped by user.', 
                date: new Date().toISOString(),
                isStopped: true 
            }]);
        }
    };

    useEffect(() => {
        setStorageItem('chat_history_chat', JSON.stringify(chatMessages));
    }, [chatMessages]);

    useEffect(() => {
        setStorageItem('chat_history_write', JSON.stringify(writeMessages));
    }, [writeMessages]);

    useEffect(() => {
        setStorageItem('active_model', selectedModel);
    }, [selectedModel]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentMessages, isTyping, showHistory]);

    useEffect(() => {
        if (pendingPrompt) {
            setChatMode('chat');
            setInput(`Please analyze this code snippet:\n\n\`\`\`\n${pendingPrompt}\n\`\`\``);
            onPromptConsumed();
            
            // Focus the textarea
            const textarea = document.querySelector('.chat-input-textarea');
            if (textarea) textarea.focus();
        }
    }, [pendingPrompt]);

    const handleSend = async (customPrompt = null) => {
        const rawMessage = customPrompt || input;
        if (!rawMessage.trim()) return;

        let finalPrompt = rawMessage;
        if (chatMode === 'write' && activeFile) {
            finalPrompt = `Based on the active file '${activeFile.name}', please write or modify the code to: ${rawMessage}. Ensure the original intent is maintained and return the full updated code.`;
        }

        const userMsg = { id: Date.now(), role: 'user', content: rawMessage, date: new Date().toISOString() };
        const updatedMessages = [...currentMessages, userMsg];
        setCurrentMessages(updatedMessages);
        setInput('');
        setIsTyping(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const historyPayload = updatedMessages.map((msg, idx) => {
            if (idx === updatedMessages.length - 1) {
                return { role: msg.role, content: finalPrompt };
            }
            return { role: msg.role, content: msg.content };
        });

        try {
            const response = await fetch(`${window.wpSynapseAI.root}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpSynapseAI.nonce
                },
                signal: controller.signal,
                body: JSON.stringify({
                    message: finalPrompt,
                    history: historyPayload,
                    file_context: activeFile ? {
                        name: activeFile.name,
                        path: activeFile.path,
                        content: activeFile.content
                    } : null,
                    model: selectedModel
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                const botMsg = { 
                    id: Date.now() + 1, 
                    role: 'assistant', 
                    content: data.reply,
                    date: new Date().toISOString(),
                    hasCode: !!data.suggested_code,
                    suggestedCode: data.suggested_code
                };
                setCurrentMessages(prev => [...prev, botMsg]);
                
                if (chatMode === 'write' && data.suggested_code) {
                    onApplyCode(data.suggested_code);
                }
            } else {
                setCurrentMessages(prev => [...prev, { 
                    id: Date.now() + 1, 
                    role: 'assistant', 
                    content: data.message || 'Failed to get response', 
                    date: new Date().toISOString(),
                    isError: true 
                }]);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setCurrentMessages(prev => [...prev, { 
                    id: Date.now() + 1, 
                    role: 'assistant', 
                    content: 'Network error occurred.', 
                    date: new Date().toISOString(),
                    isError: true 
                }]);
            }
        } finally {
            setIsTyping(false);
            abortControllerRef.current = null;
        }
    };

    const handleClearHistory = () => {
        setCurrentMessages([{ id: 1, role: 'assistant', content: `${chatMode === 'chat' ? 'Chat' : 'Write'} history cleared.`, date: new Date().toISOString() }]);
        removeStorageItem(`chat_history_${chatMode}`);
        setShowClearConfirm(false);
    };

    // Group messages by date for history view
    const groupMessagesByDate = (msgs) => {
        const groups = {};
        msgs.forEach(m => {
            const date = new Date(m.date).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(m);
        });
        return groups;
    };

    const historyGroups = groupMessagesByDate(currentMessages);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', position: 'relative' }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'relative', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: 'var(--accent)', padding: '4px', borderRadius: '6px' }}>
                            <Sparkles size={14} color="white" />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div 
                                onClick={() => setShowModelMenu(!showModelMenu)}
                                style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                {models.find(m => m.id === selectedModel)?.name || 'Select Model'}
                                <ChevronDown size={12} opacity={0.5} />
                            </div>
                            {showModelMenu && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', zIndex: 1000, minWidth: '160px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginTop: '4px' }}>
                                    {models.map(model => (
                                        <div key={model.id} onClick={() => { setSelectedModel(model.id); setShowModelMenu(false); }} style={{ padding: '8px 12px', fontSize: '0.75rem', color: selectedModel === model.id ? 'var(--accent)' : '#fff', cursor: 'pointer', borderRadius: '4px' }}>{model.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                            onClick={() => setShowHistory(!showHistory)} 
                            title="View History" 
                            style={{ background: 'transparent', border: 'none', color: showHistory ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            <History size={16} />
                        </button>
                        <button onClick={() => setShowClearConfirm(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><RefreshCw size={14} /></button>
                        {onClose && <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>}
                    </div>
                </div>

                {/* Mode Toggler */}
                <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
                    <button 
                        onClick={() => { setChatMode('chat'); setShowHistory(false); }}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', fontSize: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: chatMode === 'chat' ? 'var(--bg-tertiary)' : 'transparent', color: chatMode === 'chat' ? '#fff' : 'var(--text-secondary)' }}
                    >
                        <MessageSquare size={12} /> Chat
                    </button>
                    <button 
                        onClick={() => { setChatMode('write'); setShowHistory(false); }}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', fontSize: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: chatMode === 'write' ? 'var(--bg-tertiary)' : 'transparent', color: chatMode === 'write' ? '#fff' : 'var(--text-secondary)' }}
                    >
                        <PenTool size={12} /> Write
                    </button>
                </div>
            </div>

            {/* Clear History Modal */}
            <AnimatePresence>
                {showClearConfirm && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            zIndex: 200, 
                            background: 'rgba(15, 23, 42, 0.9)', 
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px'
                        }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{ 
                                background: 'var(--bg-secondary)', 
                                border: '1px solid var(--border)', 
                                borderRadius: '16px',
                                padding: '24px',
                                textAlign: 'center',
                                maxWidth: '300px',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{ width: '48px', height: '48px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Trash2 size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Clear {chatMode} history?</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>This action cannot be undone. Your messages for this mode will be permanently deleted.</p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setShowClearConfirm(false)}
                                    style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleClearHistory}
                                    style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                >
                                    Clear All
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active File Banner */}
            {!showHistory && !showClearConfirm && activeFile && (
                <div style={{ padding: '8px 16px', background: 'rgba(99, 102, 241, 0.05)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Referencing:</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>{activeFile.name}</span>
                </div>
            )}

            {/* Content area */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <AnimatePresence>
                    {showHistory ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                Full {chatMode === 'chat' ? 'Chat' : 'Write'} History
                            </div>
                            {Object.entries(historyGroups).map(([date, msgs]) => (
                                <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        <Calendar size={10} /> {date === new Date().toLocaleDateString() ? 'Today' : date}
                                    </div>
                                    {msgs.map(msg => (
                                        <div key={msg.id} style={{ display: 'flex', gap: '12px', opacity: msg.role === 'user' ? 0.7 : 1 }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} color="white" />}
                                            </div>
                                            <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                {msg.content.substring(0, 150)}{msg.content.length > 150 ? '...' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        currentMessages.map((msg) => (
                            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: msg.role === 'user' ? 'var(--bg-tertiary)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} color="white" />}
                                </div>
                                <div style={{ flex: 1, maxWidth: '85%' }}>
                                    <div style={{ padding: '12px', background: msg.role === 'user' ? 'var(--bg-secondary)' : (msg.isError ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)'), borderRadius: '12px', border: msg.isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)', color: msg.isError ? '#ef4444' : 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '1.5', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                        {msg.isError && <div style={{ fontWeight: 800, marginBottom: '4px', fontSize: '0.7rem', textTransform: 'uppercase' }}>System Error</div>}
                                        <Markdown content={msg.content} />
                                        {msg.hasCode && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                {chatMode === 'write' ? (
                                                    <>
                                                        <button onClick={() => onReviewCode(msg.suggestedCode)} style={{ padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}><GitCompare size={14} /> Review</button>
                                                        <button onClick={() => onApplyCode(msg.suggestedCode)} style={{ padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}><Code size={14} /> Apply</button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => navigator.clipboard.writeText(msg.suggestedCode)} style={{ padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}><FileText size={14} /> Copy Code</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                    {!showHistory && isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={16} color="white" /></div>
                            <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="loader-dots"><span style={{ background: 'var(--accent)' }}></span><span style={{ background: 'var(--accent)' }}></span><span style={{ background: 'var(--accent)' }}></span></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', opacity: 0.9, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                    {activeFile ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span>Thinking & reviewing</span>
                                            <button 
                                                onClick={() => onFileClick(activeFile)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                                                title="Click to preview file in workspace"
                                            >
                                                {getFileIcon(activeFile.name, 12)}
                                                {activeFile.name}
                                            </button>
                                        </span>
                                    ) : 'Synapse is thinking...'}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input area */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ position: 'relative' }}>
                    <textarea 
                        value={input}
                        className="chat-input-textarea"
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={chatMode === 'write' ? "Tell AI what to code..." : "Ask anything..."}
                        style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 45px 12px 12px', color: '#fff', fontSize: '0.85rem', resize: 'none', height: '80px', outline: 'none' }}
                    />
                    {isTyping ? (
                        <button 
                            onClick={handleStop} 
                            style={{ position: 'absolute', right: '12px', bottom: '12px', background: '#ef4444', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                            title="Stop Generation"
                        >
                            <Square size={16} fill="white" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleSend()} 
                            disabled={!input.trim()} 
                            style={{ position: 'absolute', right: '12px', bottom: '12px', background: input.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                            title="Send Message"
                        >
                            <Send size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIChat;
