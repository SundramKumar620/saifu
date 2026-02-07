// Saifu Wallet - Background Service Worker
// Handles all wallet operations and approval flows

import { MessageTypes, ApprovalTypes } from './messageTypes.js';

// In-memory state
let connectedSites = new Map(); // origin -> { publicKey, connected }
let pendingApprovals = new Map(); // approvalId -> { resolve, reject, type, data }
let approvalId = 0;
let isInitialized = false;

// Initialize from storage on startup
async function initialize() {
    if (isInitialized) return;

    try {
        const stored = await chrome.storage.local.get(['connectedSites']);
        if (stored?.connectedSites) {
            connectedSites = new Map(Object.entries(stored.connectedSites));
        }
        isInitialized = true;
        console.log('🔐 Saifu background initialized');
    } catch (error) {
        console.error('Failed to initialize:', error);
        // Retry after delay
        setTimeout(initialize, 1000);
    }
}

// Initialize on proper lifecycle events
chrome.runtime.onInstalled.addListener(() => {
    initialize();
});

chrome.runtime.onStartup.addListener(() => {
    initialize();
});

// Save connected sites to storage
async function saveConnectedSites() {
    const sites = Object.fromEntries(connectedSites);
    await chrome.storage.local.set({ connectedSites: sites });
}

// Get current account from storage
async function getCurrentAccount() {
    const accounts = await chrome.storage.local.get(['accounts', 'selectedAccountIndex']);
    if (!accounts.accounts || accounts.accounts.length === 0) {
        return null;
    }
    const selectedIndex = accounts.selectedAccountIndex ?? 0;
    return accounts.accounts.find(a => a.index === selectedIndex) || accounts.accounts[0];
}

// Open approval popup
async function openApprovalPopup(type, data) {
    return new Promise((resolve, reject) => {
        const id = ++approvalId;

        // Store pending approval
        pendingApprovals.set(id, { resolve, reject, type, data });

        // Create popup URL with parameters
        const params = new URLSearchParams({
            approvalId: id.toString(),
            type,
            origin: data.origin || '',
            ...data,
        });

        // Store approval data in session storage for popup to read
        chrome.storage.session.set({
            [`approval_${id}`]: { type, data, id }
        });

        // Open popup window
        chrome.windows.create({
            url: chrome.runtime.getURL(`approval.html?${params.toString()}`),
            type: 'popup',
            width: 420,
            height: 650,
            focused: true,
        }, (window) => {
            // Track window for cleanup
            const windowId = window.id;

            // Listen for window close (rejection)
            const onRemoved = (closedWindowId) => {
                if (closedWindowId === windowId) {
                    chrome.windows.onRemoved.removeListener(onRemoved);
                    const pending = pendingApprovals.get(id);
                    if (pending) {
                        pendingApprovals.delete(id);
                        chrome.storage.session.remove(`approval_${id}`);
                        pending.reject(new Error('User rejected'));
                    }
                }
            };
            chrome.windows.onRemoved.addListener(onRemoved);
        });
    });
}

// Handle connection request
async function handleConnect(origin, params) {
    // Check if already connected
    const existing = connectedSites.get(origin);
    if (existing?.connected && params.onlyIfTrusted) {
        return { result: { publicKey: existing.publicKey } };
    }

    // Get current account
    const account = await getCurrentAccount();
    if (!account) {
        return { error: 'No wallet found. Please create or import a wallet first.' };
    }

    try {
        // Open approval popup
        const approved = await openApprovalPopup(ApprovalTypes.CONNECT, {
            origin,
            address: account.address,
        });

        if (approved) {
            // Save connection
            connectedSites.set(origin, {
                connected: true,
                publicKey: account.address,
                connectedAt: Date.now(),
            });
            await saveConnectedSites();

            return { result: { publicKey: account.address } };
        }

        return { error: 'Connection rejected' };
    } catch (error) {
        return { error: error.message || 'Connection failed' };
    }
}

// Handle disconnect request
async function handleDisconnect(origin) {
    connectedSites.delete(origin);
    await saveConnectedSites();
    return { result: { success: true } };
}

// Handle get account request
async function handleGetAccount(origin) {
    const connection = connectedSites.get(origin);
    if (connection?.connected) {
        return { result: { publicKey: connection.publicKey } };
    }
    return { result: { publicKey: null } };
}

// Handle sign transaction request
async function handleSignTransaction(origin, params) {
    // Check if connected
    const connection = connectedSites.get(origin);
    if (!connection?.connected) {
        return { error: 'Not connected' };
    }

    try {
        const result = await openApprovalPopup(ApprovalTypes.SIGN_TRANSACTION, {
            origin,
            transaction: params.transaction,
            publicKey: connection.publicKey,
        });

        if (result?.signedTransaction) {
            return { result: { signedTransaction: result.signedTransaction } };
        }

        return { error: 'Transaction rejected' };
    } catch (error) {
        return { error: error.message || 'Signing failed' };
    }
}

// Handle sign all transactions request
async function handleSignAllTransactions(origin, params) {
    const connection = connectedSites.get(origin);
    if (!connection?.connected) {
        return { error: 'Not connected' };
    }

    try {
        const result = await openApprovalPopup(ApprovalTypes.SIGN_ALL_TRANSACTIONS, {
            origin,
            transactions: params.transactions,
            publicKey: connection.publicKey,
        });

        if (result?.signedTransactions) {
            return { result: { signedTransactions: result.signedTransactions } };
        }

        return { error: 'Transactions rejected' };
    } catch (error) {
        return { error: error.message || 'Signing failed' };
    }
}

// Handle sign message request
async function handleSignMessage(origin, params) {
    const connection = connectedSites.get(origin);
    if (!connection?.connected) {
        return { error: 'Not connected' };
    }

    try {
        const result = await openApprovalPopup(ApprovalTypes.SIGN_MESSAGE, {
            origin,
            message: params.message,
            display: params.display,
            publicKey: connection.publicKey,
        });

        if (result?.signature) {
            return { result: { signature: result.signature } };
        }

        return { error: 'Message signing rejected' };
    } catch (error) {
        return { error: error.message || 'Signing failed' };
    }
}

// Handle approval responses from popup
async function handleApprovalResponse(approvalId, approved, data) {
    const pending = pendingApprovals.get(approvalId);
    if (!pending) {
        console.warn('No pending approval found:', approvalId);
        return;
    }

    pendingApprovals.delete(approvalId);
    chrome.storage.session.remove(`approval_${approvalId}`);

    if (approved) {
        pending.resolve(data || true);
    } else {
        pending.reject(new Error('User rejected'));
    }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle async operations
    (async () => {
        // Ensure initialized before handling messages
        await initialize();

        const { type, params, origin } = message;
        let response;

        switch (type) {
            case MessageTypes.CONNECT:
                response = await handleConnect(origin, params || {});
                break;

            case MessageTypes.DISCONNECT:
                response = await handleDisconnect(origin);
                break;

            case MessageTypes.GET_ACCOUNT:
                response = await handleGetAccount(origin);
                break;

            case MessageTypes.SIGN_TRANSACTION:
                response = await handleSignTransaction(origin, params);
                break;

            case MessageTypes.SIGN_ALL_TRANSACTIONS:
                response = await handleSignAllTransactions(origin, params);
                break;

            case MessageTypes.SIGN_MESSAGE:
                response = await handleSignMessage(origin, params);
                break;

            case MessageTypes.APPROVAL_RESPONSE:
                await handleApprovalResponse(message.approvalId, message.approved, message.data);
                response = { result: { success: true } };
                break;

            default:
                response = { error: `Unknown message type: ${type}` };
        }

        sendResponse(response);
    })();

    // Return true to indicate async response
    return true;
});

// Extension icon click - just opens popup (default behavior)
chrome.action.onClicked.addListener((tab) => {
    // Default popup handles this
});

console.log('🔐 Saifu background service worker started');
