import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Folder, Loader2, ListFilter, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFileIcon } from '../utils/icons';
import { useFeatures } from './FeatureContext';
import FeatureLock from './FeatureLock';
import { getStorageItem, setStorageItem } from '../utils/storage';

const SidebarSearch = ({ onFileClick, isDarkMode }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState(() => getStorageItem('search_type') || 'files'); 
    const { isEnabled } = useFeatures();
    const inputRef = useRef(null);

    // Save to localStorage when state changes
    useEffect(() => {
        setStorageItem('search_type', searchType);
    }, [searchType]);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setLoading(true);
                try {
                    const response = await fetch(`${window.wpSynapseAI.root}/search-files?q=${encodeURIComponent(query)}&type=${searchType}`, {
                        headers: { 'X-WP-Nonce': window.wpSynapseAI.nonce }
                    });
                    const data = await response.json();
                    setResults(data);
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [query, searchType]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar-bg)' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Search</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => setSearchType('files')}
                            title="Search Files Only"
                            style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: searchType === 'files' ? 'var(--accent)' : 'var(--text-secondary)', opacity: searchType === 'files' ? 1 : 0.6 }}
                        >
                            <Folder size={14} />
                        </button>
                        <button 
                            onClick={() => setSearchType('code')}
                            title="Search Code Only (Pro)"
                            style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: searchType === 'code' ? 'var(--accent)' : 'var(--text-secondary)', opacity: searchType === 'code' ? 1 : 0.6 }}
                            disabled={!isEnabled('grep_search') && searchType !== 'code'}
                        >
                            <Code size={14} />
                            {!isEnabled('grep_search') && <span style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%' }} />}
                        </button>
                        <button 
                            onClick={() => setSearchType('both')}
                            title="Search All (Pro)"
                            style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: searchType === 'both' ? 'var(--accent)' : 'var(--text-secondary)', opacity: searchType === 'both' ? 1 : 0.6 }}
                            disabled={!isEnabled('grep_search') && searchType !== 'both'}
                        >
                            <ListFilter size={14} />
                            {!isEnabled('grep_search') && <span style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%' }} />}
                        </button>
                    </div>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '4px',
                    padding: '0 8px',
                    height: '32px'
                }}>
                    <Search size={14} style={{ color: 'var(--text-secondary)', marginRight: '8px' }} />
                    <input 
                        ref={inputRef}
                        type="text"
                        placeholder="Search files..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            width: '100%'
                        }}
                    />
                    {loading ? (
                        <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    ) : query && (
                        <X 
                            size={12} 
                            style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} 
                            onClick={() => setQuery('')} 
                        />
                    )}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {results.length > 0 ? (
                    results.map((result, i) => (
                        <div 
                            key={i}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                borderBottom: '1px solid rgba(255,255,255,0.03)'
                            }}
                        >
                            <div 
                                onClick={() => onFileClick(result)}
                                style={{
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'background 0.2s'
                                }}
                                className="search-result-item-sidebar"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', minWidth: '16px' }}>
                                    {result.type === 'directory' ? <Folder size={14} color="#3b82f6" /> : getFileIcon(result.name, 14)}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                    <span style={{ 
                                        fontSize: '0.8rem', 
                                        fontWeight: 600, 
                                        color: 'var(--text-primary)',
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap' 
                                    }}>
                                        {result.name}
                                    </span>
                                    <span style={{ 
                                        fontSize: '0.6rem', 
                                        color: 'var(--text-secondary)', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap',
                                        opacity: 0.5
                                    }}>
                                        {result.path}
                                    </span>
                                </div>
                            </div>

                            {/* Code Matches */}
                            {result.matches && result.matches.length > 0 && (
                                <div style={{ padding: '0 0 8px 0' }}>
                                    {result.matches.map((match, mi) => (
                                        <div 
                                            key={mi}
                                            onClick={() => onFileClick({ ...result, line: match.line })}
                                            style={{
                                                padding: '4px 16px 4px 42px',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                color: 'var(--text-secondary)',
                                                display: 'flex',
                                                gap: '8px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                            className="search-code-match"
                                        >
                                            <span style={{ color: 'var(--accent)', minWidth: '20px', opacity: 0.7 }}>{match.line}</span>
                                            <span style={{ 
                                                flex: 1, 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis',
                                                fontFamily: 'monospace'
                                            }}>
                                                {match.text.split(new RegExp(`(${query})`, 'gi')).map((part, pi) => 
                                                    part.toLowerCase() === query.toLowerCase() ? 
                                                    <span key={pi} style={{ background: 'rgba(99, 102, 241, 0.4)', color: 'var(--text-primary)', borderRadius: '2px', padding: '0 2px' }}>{part}</span> : 
                                                    part
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : query.trim().length >= 2 && !loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        No results found
                    </div>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.5 }}>
                        Type at least 2 characters to search
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidebarSearch;
