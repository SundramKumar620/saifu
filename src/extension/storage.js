// Chrome storage wrapper for extension
// This replaces IndexedDB for extension context

const isExtension = typeof chrome !== 'undefined' && chrome.storage;

export async function saveToStorage(key, value) {
    if (!isExtension) {
        return;
    }
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

export async function loadFromStorage(key) {
    if (!isExtension) {
        return null;
    }
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result[key]);
            }
        });
    });
}

export async function clearStorage() {
    if (!isExtension) {
        return;
    }
    return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

export async function saveEncryptedMnemonicToStorage(data) {
    return saveToStorage('encryptedMnemonic', data);
}

export async function loadEncryptedMnemonicFromStorage() {
    return loadFromStorage('encryptedMnemonic');
}

// Get all storage data
export async function getAllStorage() {
    if (!isExtension) {
        return {};
    }
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}
