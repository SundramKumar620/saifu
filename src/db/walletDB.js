import { openDB } from "idb";

// Detect if running as Chrome extension
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

// IndexedDB setup for web app
export const walletDB = !isExtension ? openDB("walletDB", 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains("vault")) {
            db.createObjectStore("vault");
        }
    },
}) : null;

// Chrome storage helpers
async function chromeStorageGet(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
            resolve(result[key]);
        });
    });
}

async function chromeStorageSet(key, value) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
    });
}

async function chromeStorageClear() {
    return new Promise((resolve) => {
        chrome.storage.local.clear(resolve);
    });
}

// Unified storage API
export async function saveToVault(key, value) {
    if (isExtension) {
        await chromeStorageSet(key, value);
    } else {
        const db = await walletDB;
        await db.put("vault", value, key);
    }
}

export async function loadFromVault(key) {
    if (isExtension) {
        return await chromeStorageGet(key);
    } else {
        const db = await walletDB;
        return db.get("vault", key);
    }
}

export async function clearVault() {
    if (isExtension) {
        await chromeStorageClear();
    } else {
        const db = await walletDB;
        await db.clear("vault");
    }
}

export async function saveEncryptedMnemonic(data) {
    await saveToVault("encryptedMnemonic", data);
}

export async function loadEncryptedMnemonic() {
    return await loadFromVault("encryptedMnemonic");
}
