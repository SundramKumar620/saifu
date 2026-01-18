import { openDB } from "idb";

export const walletDB = openDB("walletDB", 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains("vault")) {
            db.createObjectStore("vault");
        }
    },
});

export async function saveToVault(key, value) {
    const db = await walletDB;
    await db.put("vault", value, key);
}

export async function loadFromVault(key) {
    const db = await walletDB;
    return db.get("vault", key);
}

export async function clearVault() {
    const db = await walletDB;
    await db.clear("vault");
}

export async function saveEncryptedMnemonic(data) {
    const db = await walletDB;
    await db.put("vault", data, "encryptedMnemonic");
}

export async function loadEncryptedMnemonic() {
    const db = await walletDB;
    return db.get("vault", "encryptedMnemonic");
}

