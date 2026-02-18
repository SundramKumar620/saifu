// Saifu Wallet - Inpage Provider Script
// This script is injected into web pages and exposes the wallet provider

import { MessageTypes } from './messageTypes.js';

class SaifuWalletProvider extends EventTarget {
    constructor() {
        super();

        // Phantom compatibility flags
        this.isPhantom = true;
        this.isSaifu = true;

        // State
        this.publicKey = null;
        this.isConnected = false;
        this._pendingRequests = new Map();
        this._requestId = 0;

        // Listen for responses from content script
        window.addEventListener('message', this._handleMessage.bind(this));

        // Check if already connected
        this._checkConnection();
    }

    async _checkConnection() {
        try {
            const response = await this._sendRequest(MessageTypes.GET_ACCOUNT, {});
            if (response.publicKey) {
                this.publicKey = new PublicKeyProxy(response.publicKey);
                this.isConnected = true;
                this._emitEvent('connect', { publicKey: this.publicKey });
            }
        } catch (e) {
            // Not connected yet, that's fine
        }
    }

    _handleMessage(event) {
        if (event.source !== window) return;
        if (event.data.target !== 'saifu-content') return;


        const { id, error, result } = event.data.data || {};
        const pending = this._pendingRequests.get(id);

        if (pending) {
            this._pendingRequests.delete(id);
            if (error) {
                pending.reject(new Error(error));
            } else {
                pending.resolve(result);
            }
        }
    }

    _sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            const id = ++this._requestId;
            this._pendingRequests.set(id, { resolve, reject });

            window.postMessage({
                target: 'saifu-inpage',
                type: method,
                data: {
                    id,
                    method,
                    params,
                    origin: window.location.origin,
                }
            }, '*');

            // Timeout after 5 minutes (user might take time to approve)
            setTimeout(() => {
                if (this._pendingRequests.has(id)) {
                    this._pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 300000);
        });
    }

    _emitEvent(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
        // Also emit for legacy listeners
        if (this._listeners && this._listeners[eventName]) {
            this._listeners[eventName].forEach(cb => cb(detail));
        }
    }

    // Legacy event emitter API (Phantom compatibility)
    _listeners = {};

    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        return this;
    }

    off(event, callback) {
        if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        }
        return this;
    }

    removeListener(event, callback) {
        return this.off(event, callback);
    }

    removeAllListeners(event) {
        if (event) {
            this._listeners[event] = [];
        } else {
            this._listeners = {};
        }
        return this;
    }

    // Wallet Standard Methods

    async connect(options = {}) {
        try {
            const response = await this._sendRequest(MessageTypes.CONNECT, {
                onlyIfTrusted: options.onlyIfTrusted || false,
            });


            // Handle error response
            if (response.error) {
                throw new Error(response.error);
            }

            // Unwrap result object
            const result = response.result || response;

            if (result.publicKey) {
                this.publicKey = new PublicKeyProxy(result.publicKey);
                this.isConnected = true;
                this._emitEvent('connect', { publicKey: this.publicKey });
                return { publicKey: this.publicKey };
            }

            throw new Error('Connection rejected');
        } catch (error) {
            throw error;
        }
    }

    async disconnect() {
        try {
            await this._sendRequest(MessageTypes.DISCONNECT, {});
            this.publicKey = null;
            this.isConnected = false;
            this._emitEvent('disconnect');
        } catch (error) {
            // silently ignore disconnect errors
        }
    }

    async signTransaction(transaction) {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }

        // Serialize transaction for transport
        const serialized = serializeTransaction(transaction);

        const response = await this._sendRequest(MessageTypes.SIGN_TRANSACTION, {
            transaction: serialized,
        });

        if (response.signedTransaction) {
            const signedBytes = new Uint8Array(response.signedTransaction);
            // Reconstruct using the dApp's Transaction class
            if (transaction.constructor?.from) {
                return transaction.constructor.from(signedBytes);
            }
            return signedBytes;
        }

        throw new Error('Transaction signing rejected');
    }

    async signAllTransactions(transactions) {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }

        const serialized = transactions.map(tx => serializeTransaction(tx));

        const response = await this._sendRequest(MessageTypes.SIGN_ALL_TRANSACTIONS, {
            transactions: serialized,
        });

        if (response.signedTransactions) {
            return response.signedTransactions.map((tx, i) => {
                const signedBytes = new Uint8Array(tx);
                // Reconstruct using the dApp's Transaction class
                if (transactions[i]?.constructor?.from) {
                    return transactions[i].constructor.from(signedBytes);
                }
                return signedBytes;
            });
        }

        throw new Error('Transaction signing rejected');
    }

    async signMessage(message, display) {
        if (!this.isConnected) {
            throw new Error('Wallet not connected');
        }

        // Convert message to base64 if it's a Uint8Array
        const messageBase64 = typeof message === 'string'
            ? btoa(message)
            : btoa(String.fromCharCode(...message));

        const response = await this._sendRequest(MessageTypes.SIGN_MESSAGE, {
            message: messageBase64,
            display: display || 'utf8',
        });

        if (response.signature) {
            // Return as Uint8Array
            return {
                signature: Uint8Array.from(atob(response.signature), c => c.charCodeAt(0)),
                publicKey: this.publicKey,
            };
        }

        throw new Error('Message signing rejected');
    }

    // Phantom-compatible method
    async signAndSendTransaction(transaction, options = {}) {
        const signedTx = await this.signTransaction(transaction);
        // Note: Actual sending would need to happen via the dApp
        // This is just for compatibility
        return signedTx;
    }
}

// Proxy for PublicKey that mimics Solana web3.js PublicKey
class PublicKeyProxy {
    constructor(base58String) {
        this._base58 = base58String;
    }

    toString() {
        return this._base58;
    }

    toBase58() {
        return this._base58;
    }

    toBytes() {
        // Base58 decode would go here
        return this._base58;
    }

    equals(other) {
        return this._base58 === (other?.toBase58?.() || other?.toString?.() || other);
    }
}

// Transaction serialization helpers
function serializeTransaction(transaction) {
    if (transaction.serialize) {
        // web3.js Transaction
        return Array.from(transaction.serialize({ requireAllSignatures: false }));
    }
    if (transaction instanceof Uint8Array) {
        return Array.from(transaction);
    }
    return transaction;
}

function deserializeTransaction(data) {
    // Return as Uint8Array - dApp will deserialize
    if (Array.isArray(data)) {
        return new Uint8Array(data);
    }
    return data;
}

// Inject the provider
if (typeof window !== 'undefined') {
    const provider = new SaifuWalletProvider();

    // Check if window.solana already exists (another wallet extension)
    if (!window.solana) {
        // Expose as window.solana (standard)
        Object.defineProperty(window, 'solana', {
            value: provider,
            writable: false,
            configurable: true,
        });
    } else {
        // window.solana already defined by another wallet
    }

    // Always expose as window.saifu
    Object.defineProperty(window, 'saifu', {
        value: provider,
        writable: false,
        configurable: true,
    });

    // Announce wallet for Wallet Standard discovery
    window.dispatchEvent(new Event('wallet-standard:register'));


}
