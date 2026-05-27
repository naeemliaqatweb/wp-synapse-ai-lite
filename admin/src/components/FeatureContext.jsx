import React, { createContext, useContext, useState, useEffect } from 'react';

const FeatureContext = createContext();

export const FeatureProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        dev_mode: true,
        is_premium: false,
        features: {},
        ai_api_key: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${window.wpSynapseAI.root}/settings`, {
                headers: { 'X-WP-Nonce': window.wpSynapseAI.nonce }
            });
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const isEnabled = (feature) => {
        if (!settings || !settings.features) return true;
        
        // If the feature is explicitly disabled by the user, honor that choice
        if (settings.features[feature] === false) return false;

        // If in dev mode, allow all other features even if not premium
        if (settings.dev_mode) return true;
        
        const basicFeatures = ['monaco_editor', 'file_manager', 'basic_search', 'theme_toggle', 'uploads'];
        if (basicFeatures.includes(feature)) {
            return !!settings.features[feature];
        }
        
        return !!(settings.is_premium && settings.features[feature]);
    };

    return (
        <FeatureContext.Provider value={{ settings, isEnabled, loading, refreshSettings: fetchSettings }}>
            {children}
        </FeatureContext.Provider>
    );
};

export const useFeatures = () => useContext(FeatureContext);
