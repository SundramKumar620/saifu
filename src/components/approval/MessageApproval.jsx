import { useState } from 'react';
import logo from '../../assets/logo.png';

export default function MessageApproval({
    origin,
    message,
    display = 'utf8',
    publicKey,
    onApprove,
    onReject
}) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSigning, setIsSigning] = useState(false);

    const getDomainFromOrigin = (originUrl) => {
        try {
            const url = new URL(originUrl);
            return url.hostname;
        } catch {
            return originUrl;
        }
    };

    const getDisplayMessage = () => {
        if (!message) return '';
        try {
            const decoded = atob(message);
            if (display === 'hex') {
                return Array.from(decoded, c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
            }
            return decoded;
        } catch {
            return message;
        }
    };

    const handleApprove = async () => {
        if (!password) {
            setError('Password is required');
            return;
        }

        setIsSigning(true);
        setError('');

        try {
            const { loadEncryptedMnemonicFromStorage, loadFromStorage } = await import('../../extension/storage.js');
            const { decryptMnemonic } = await import('../../crypto/crypto.js');
            const { derivePrivateKey } = await import('../../crypto/deriveAccount.js');
            const nacl = (await import('tweetnacl')).default;
            const bs58 = (await import('bs58')).default;

            const encrypted = await loadEncryptedMnemonicFromStorage();
            if (!encrypted) {
                throw new Error('No wallet found');
            }

            const mnemonic = await decryptMnemonic(encrypted, password);

            const accounts = await loadFromStorage('accounts');
            const account = accounts?.find(a => a.address === publicKey) || accounts?.[0];
            const accountIndex = account?.index ?? 0;

            const privateKeyBase58 = derivePrivateKey(mnemonic, accountIndex);
            const secretKey = bs58.decode(privateKeyBase58);

            const messageBytes = Uint8Array.from(atob(message), c => c.charCodeAt(0));
            const signature = nacl.sign.detached(messageBytes, secretKey);
            const signatureBase64 = btoa(String.fromCharCode(...signature));

            await onApprove({ signature: signatureBase64 });
        } catch (err) {
            console.error('Signing error:', err);
            if (err.message?.includes('decrypt') || err.message?.includes('password')) {
                setError('Wrong password');
            } else {
                setError(err.message || 'Failed to sign message');
            }
            setIsSigning(false);
        }
    };

    return (
        <div className="approval-card">
            {/* Header - matching wallet-header */}
            <div className="approval-header">
                <div className="approval-header-left">
                    <div className="approval-logo">
                        <img src={logo} alt="Saifu" />
                    </div>
                    <h1 className="approval-title">Sign Message</h1>
                </div>
                <div className="approval-origin-badge">
                    {getDomainFromOrigin(origin)}
                </div>
            </div>

            {/* Details Section */}
            <div className="approval-content">
                <div className="approval-section">
                    <div className="approval-label">Signing Account</div>
                    <div className="approval-value">
                        <span className="approval-address">{publicKey}</span>
                    </div>
                </div>

                <div className="approval-section">
                    <div className="approval-label">Message Content</div>
                    <div className="message-content">
                        {getDisplayMessage() || 'Empty message'}
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="approval-warning">
                <span className="approval-warning-icon">⚠️</span>
                <span className="approval-warning-text">
                    Only sign messages from trusted sites. Signatures may have security implications.
                </span>
            </div>

            {/* Password Input */}
            <div className="approval-password">
                <input
                    type="password"
                    placeholder="Enter password to sign"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleApprove()}
                />
                {error && <p className="approval-password-error">{error}</p>}
            </div>

            {/* Action Buttons */}
            <div className="approval-actions">
                <button
                    className="approval-btn approval-btn-reject"
                    onClick={onReject}
                    disabled={isSigning}
                >
                    Reject
                </button>
                <button
                    className="approval-btn approval-btn-approve"
                    onClick={handleApprove}
                    disabled={isSigning || !password}
                >
                    {isSigning ? 'Signing...' : 'Sign Message'}
                </button>
            </div>
        </div>
    );
}
