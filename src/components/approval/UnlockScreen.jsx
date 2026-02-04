import { useState } from 'react';
import { Lock } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function UnlockScreen({ onUnlock, onCancel }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);

    const handleUnlock = async () => {
        if (!password) {
            setError('Password is required');
            return;
        }

        setIsUnlocking(true);
        setError('');

        try {
            // Verify password by trying to decrypt mnemonic
            const { decryptMnemonic } = await import('../../crypto/crypto.js');

            // Get encrypted mnemonic from storage
            const result = await chrome.storage.local.get('encryptedMnemonic');
            const encrypted = result.encryptedMnemonic;

            if (!encrypted) {
                throw new Error('No wallet found');
            }

            // Try to decrypt - will throw if password is wrong
            await decryptMnemonic(encrypted, password);

            // Password is correct, unlock the wallet
            // Store unlock state in session storage (temporary)
            await chrome.storage.session.set({ walletUnlocked: true });

            onUnlock();
        } catch (err) {
            console.error('Unlock error:', err);
            if (err.message?.includes('decrypt') || err.message?.includes('password') || err.message?.includes('MAC')) {
                setError('Incorrect password');
            } else {
                setError(err.message || 'Failed to unlock wallet');
            }
            setIsUnlocking(false);
        }
    };

    return (
        <div className="approval-card">
            {/* Header */}
            <div className="approval-header">
                <div className="approval-header-left">
                    <div className="approval-logo">
                        <img src={logo} alt="Saifu" />
                    </div>
                    <h1 className="approval-title">Unlock Wallet</h1>
                </div>
            </div>

            {/* Content */}
            <div className="approval-content">
                <div className="approval-section" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(102, 126, 234, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <Lock size={36} color="#667eea" />
                    </div>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: 14,
                        lineHeight: 1.6,
                        margin: 0
                    }}>
                        Your wallet is locked. Enter your password to continue with this request.
                    </p>
                </div>
            </div>

            {/* Password Input */}
            <div className="approval-password">
                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    autoFocus
                />
                {error && <p className="approval-password-error">{error}</p>}
            </div>

            {/* Action Buttons */}
            <div className="approval-actions">
                <button
                    className="approval-btn approval-btn-reject"
                    onClick={onCancel}
                    disabled={isUnlocking}
                >
                    Cancel
                </button>
                <button
                    className="approval-btn approval-btn-approve"
                    onClick={handleUnlock}
                    disabled={isUnlocking || !password}
                >
                    {isUnlocking ? 'Unlocking...' : 'Unlock'}
                </button>
            </div>
        </div>
    );
}
