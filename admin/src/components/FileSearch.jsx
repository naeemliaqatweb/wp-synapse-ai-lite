import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Folder, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFileIcon } from '../utils/icons';

const FileSearch = ({ onFileClick, isDarkMode, onExpandChange }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowResults(false);
                if (!query) {
                    setIsExpanded(false);
                    onExpandChange?.(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [query, onExpandChange]);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                try {
                    const response = await fetch(`${window.wpSynapseAILite.root}/search-files?q=${encodeURIComponent(query)}`, {
                        headers: { 'X-WP-Nonce': window.wpSynapseAILite.nonce }
                    });
                    const data = await response.json();
                    setResults(data);
                    setShowResults(true);
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [query]);

    const handleIconClick = () => {
        setIsExpanded(true);
        onExpandChange?.(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    return (
        <div className="file-search-container" ref={searchRef} style={{ padding: '0', position: 'relative', width: '100%' }}>
            <motion.div 
                initial={false}
                animate={{ 
                    width: isExpanded ? '100%' : '32px',
                }}
                style={{ 
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: isExpanded ? 'default' : 'pointer',
                    boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                }}
                onClick={() => !isExpanded && handleIconClick()}
            >
                <div style={{ padding: '0 9px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <Search size={14} />
                </div>
                
                {isExpanded && (
                    <input 
                        ref={inputRef}
                        type="text"
                        placeholder="Find files..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            padding: '0 4px',
                            fontSize: '0.75rem',
                            color: 'var(--text-primary)',
                            outline: 'none'
                        }}
                        onBlur={() => !query && setIsExpanded(false)}
                    />
                )}

                {isExpanded && query && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setQuery(''); }}
                        style={{ padding: '0 8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    </button>
                )}
            </motion.div>

            <AnimatePresence>
                {showResults && results.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0.8rem',
                            right: '0.8rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                            zIndex: 100,
                            maxHeight: '300px',
                            overflowY: 'auto',
                            marginTop: '4px'
                        }}
                    >
                        {results.map((result, i) => (
                            <div 
                                key={i}
                                onClick={() => {
                                    onFileClick(result);
                                    setShowResults(false);
                                    setQuery('');
                                    setIsExpanded(false);
                                }}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: i === results.length - 1 ? 'none' : '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    transition: 'background 0.2s'
                                }}
                                className="search-result-item"
                            >
                                {result.type === 'directory' ? <Folder size={14} color="#3b82f6" /> : getFileIcon(result.name, 14)}
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.name}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.path}</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FileSearch;
