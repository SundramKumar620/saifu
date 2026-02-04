import { useState } from 'react';
import { Eye, FileSignature, Send } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function ConnectApproval({ origin, address, onApprove, onReject }) {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleApprove = async () => {
        setIsConnecting(true);
        try {
            // Pass the publicKey back to the background script
            await onApprove({ publicKey: address });
        } catch (error) {
            console.error('Approval error:', error);
            setIsConnecting(false);
        }
    };

    const getDomainFromOrigin = (originUrl) => {
        try {
            const url = new URL(originUrl);
            return url.hostname;
        } catch {
            return originUrl;
        }
    };

    const truncateAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <div className="approval-card">
            {/* Header - matching wallet-header exactly */}
            <div className="approval-header">
                <div className="approval-header-left">
                    <div className="approval-logo">
                        <img src={logo} alt="Saifu" />
                    </div>
                    <h1 className="approval-title">Connection Request</h1>
                </div>
                <div className="approval-origin-badge">
                    {getDomainFromOrigin(origin)}
                </div>
            </div>

            {/* Details Section - matching balance-card style */}
            <div className="approval-content">
                <div className="approval-section">
                    <div className="approval-label">This site is requesting to</div>
                    <ul className="approval-permissions">
                        <li>
                            <span className="permission-icon"><Eye size={16} /></span>
                            View your wallet address
                        </li>
                        <li>
                            <span className="permission-icon"><FileSignature size={16} /></span>
                            Request transaction approvals
                        </li>
                        <li>
                            <span className="permission-icon"><Send size={16} /></span>
                            Request message signatures
                        </li>
                    </ul>
                </div>

                <div className="approval-section">
                    <div className="approval-label">Account to Connect</div>
                    <div className="approval-value">
                        <span className="approval-address">
                            {address || 'No account available'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="approval-warning">
                <span className="approval-warning-icon">⚠️</span>
                <span className="approval-warning-text">
                    Only connect to trusted sites. Connected sites can request transaction signatures.
                </span>
            </div>

            {/* Action Buttons - matching wallet-actions style */}
            <div className="approval-actions">
                <button
                    className="approval-btn approval-btn-reject"
                    onClick={onReject}
                    disabled={isConnecting}
                >
                    Cancel
                </button>
                <button
                    className="approval-btn approval-btn-approve"
                    onClick={handleApprove}
                    disabled={isConnecting || !address}
                >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
            </div>
        </div>
    );
}
