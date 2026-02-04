import { useState } from 'react';
import logo from '../../assets/logo.png';

export default function TransactionApproval({
    origin,
    transaction,
    transactions,
    publicKey,
    isMultiple = false,
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
            const { Transaction, Keypair } = await import('@solana/web3.js');
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
            const keypair = Keypair.fromSecretKey(secretKey);

            if (isMultiple && transactions) {
                const signedTxs = [];
                for (const txData of transactions) {
                    const txBytes = new Uint8Array(txData);
                    const tx = Transaction.from(txBytes);
                    tx.sign(keypair);
                    signedTxs.push(Array.from(tx.serialize()));
                }
                await onApprove({ signedTransactions: signedTxs });
            } else if (transaction) {
                const txBytes = new Uint8Array(transaction);
                const tx = Transaction.from(txBytes);
                tx.sign(keypair);
                const signedTx = Array.from(tx.serialize());
                await onApprove({ signedTransaction: signedTx });
            }
        } catch (err) {
            console.error('Signing error:', err);
            if (err.message?.includes('decrypt') || err.message?.includes('password')) {
                setError('Wrong password');
            } else {
                setError(err.message || 'Failed to sign transaction');
            }
            setIsSigning(false);
        }
    };

    const txCount = isMultiple ? transactions?.length || 0 : 1;

    return (
        <div className="approval-card">
            {/* Header - matching wallet-header */}
            <div className="approval-header">
                <div className="approval-header-left">
                    <div className="approval-logo">
                        <img src={logo} alt="Saifu" />
                    </div>
                    <h1 className="approval-title">
                        {isMultiple ? `Sign ${txCount} Transactions` : 'Sign Transaction'}
                    </h1>
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
                    <div className="approval-label">Transaction Details</div>
                    <div className="transaction-details">
                        <div className="transaction-detail">
                            <span className="transaction-detail-label">Transactions</span>
                            <span className="transaction-detail-value">{txCount}</span>
                        </div>
                        <div className="transaction-detail">
                            <span className="transaction-detail-label">Network</span>
                            <span className="transaction-detail-value">Solana Devnet</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="approval-warning">
                <span className="approval-warning-icon">⚠️</span>
                <span className="approval-warning-text">
                    Review carefully. Signed transactions cannot be reversed.
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
                    {isSigning ? 'Signing...' : 'Approve & Sign'}
                </button>
            </div>
        </div>
    );
}
