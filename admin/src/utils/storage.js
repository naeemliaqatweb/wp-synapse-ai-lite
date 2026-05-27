const getSiteKey = (key) => {
  const siteId = window.wpSynapseAI?.siteId || '';
  return siteId ? `synapse_${siteId}_${key}` : `synapse_${key}`;
};

export const getStorageItem = (key, defaultValue = null) => {
  try {
    const siteKey = getSiteKey(key);
    let value = localStorage.getItem(siteKey);
    if (value === null) {
      // Fallback and migrate old global key if present
      const oldKey = `synapse_${key}`;
      value = localStorage.getItem(oldKey);
      if (value !== null) {
        localStorage.setItem(siteKey, value);
      }
    }
    return value !== null ? value : defaultValue;
  } catch (e) {
    console.error("Storage read error", e);
    return defaultValue;
  }
};

export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(getSiteKey(key), value);
  } catch (e) {
    console.error("Storage write error", e);
  }
};

export const removeStorageItem = (key) => {
  try {
    localStorage.removeItem(getSiteKey(key));
  } catch (e) {
    console.error("Storage remove error", e);
  }
};
