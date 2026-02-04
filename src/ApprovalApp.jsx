import { useState, useEffect } from 'react';
import { MessageTypes, ApprovalTypes } from './extension/messageTypes.js';
import ConnectApproval from './components/approval/ConnectApproval.jsx';
import TransactionApproval from './components/approval/TransactionApproval.jsx';
import MessageApproval from './components/approval/MessageApproval.jsx';
import UnlockScreen from './components/approval/UnlockScreen.jsx';
import bg from './assets/bg.png';
import './styles/ApprovalApp.css';


export default function ApprovalApp() {
    const [approvalData, setApprovalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLocked, setIsLocked] = useState(true);
    const [checkingLock, setCheckingLock] = useState(true);

    // Check if wallet is locked
    useEffect(() => {
        async function checkWalletLock() {
            try {
                // Check if wallet exists first
                const { encryptedMnemonic } = await chrome.storage.local.get('encryptedMnemonic');
                if (!encryptedMnemonic) {
                    setError('No wallet found. Please create or import a wallet first.');
                    setCheckingLock(false);
                    setLoading(false);
                    return;
                }

                // Check session storage for unlock state
                const { walletUnlocked } = await chrome.storage.session.get('walletUnlocked');
                setIsLocked(!walletUnlocked);
                setCheckingLock(false);
            } catch (err) {
                console.error('Error checking wallet lock:', err);
                setIsLocked(true);
                setCheckingLock(false);
            }
        }
        checkWalletLock();
    }, []);

    // Load approval data
    useEffect(() => {
        // Parse URL parameters
        const params = new URLSearchParams(window.location.search);
        const approvalId = params.get('approvalId');
        const type = params.get('type');
        const origin = params.get('origin');

        if (!approvalId || !type) {
            setError('Invalid approval request');
            setLoading(false);
            return;
        }

        // Load full approval data from session storage
        chrome.storage.session.get(`approval_${approvalId}`, (result) => {
            const data = result[`approval_${approvalId}`];
            if (data) {
                setApprovalData({
                    ...data,
                    approvalId: parseInt(approvalId),
                    type,
                    origin,
                });
            } else {
                // Fallback to URL params
                setApprovalData({
                    approvalId: parseInt(approvalId),
                    type,
                    origin,
                    data: Object.fromEntries(params),
                });
            }
            setLoading(false);
        });
    }, []);

    const handleUnlock = () => {
        setIsLocked(false);
    };

    const handleApprove = async (responseData = {}) => {
        if (!approvalData) return;

        await chrome.runtime.sendMessage({
            type: MessageTypes.APPROVAL_RESPONSE,
            approvalId: approvalData.approvalId,
            approved: true,
            data: responseData,
        });

        window.close();
    };

    const handleReject = async () => {
        if (!approvalData) return;

        await chrome.runtime.sendMessage({
            type: MessageTypes.APPROVAL_RESPONSE,
            approvalId: approvalData.approvalId,
            approved: false,
        });

        window.close();
    };

    // Show loading while checking lock status or loading data
    if (loading || checkingLock) {
        return (
            <div className="approval-container" style={{ backgroundImage: `url(${bg})` }}>
                <div className="approval-loading">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // Show error
    if (error) {
        return (
            <div className="approval-container" style={{ backgroundImage: `url(${bg})` }}>
                <div className="approval-card">
                    <div className="approval-error">
                        <h2>Error</h2>
                        <p>{error}</p>
                        <button
                            className="approval-btn approval-btn-reject"
                            onClick={() => window.close()}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show unlock screen if wallet is locked AND it's a signing operation
    // Connection requests don't need unlock
    const requiresUnlock = isLocked && approvalData?.type !== ApprovalTypes.CONNECT;

    if (requiresUnlock) {
        return (
            <div className="approval-container" style={{ backgroundImage: `url(${bg})` }}>
                <UnlockScreen
                    onUnlock={handleUnlock}
                    onCancel={handleReject}
                />
            </div>
        );
    }

    const renderApproval = () => {
        switch (approvalData?.type) {
            case ApprovalTypes.CONNECT:
                return (
                    <ConnectApproval
                        origin={approvalData.origin}
                        address={approvalData.data?.address}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                );

            case ApprovalTypes.SIGN_TRANSACTION:
                return (
                    <TransactionApproval
                        origin={approvalData.origin}
                        transaction={approvalData.data?.transaction}
                        publicKey={approvalData.data?.publicKey}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                );

            case ApprovalTypes.SIGN_ALL_TRANSACTIONS:
                return (
                    <TransactionApproval
                        origin={approvalData.origin}
                        transactions={approvalData.data?.transactions}
                        publicKey={approvalData.data?.publicKey}
                        isMultiple={true}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                );

            case ApprovalTypes.SIGN_MESSAGE:
                return (
                    <MessageApproval
                        origin={approvalData.origin}
                        message={approvalData.data?.message}
                        display={approvalData.data?.display}
                        publicKey={approvalData.data?.publicKey}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                );

            default:
                return (
                    <div className="approval-card">
                        <div className="approval-error">
                            <h2>Unknown Request</h2>
                            <p>Unknown approval type: {approvalData?.type}</p>
                            <button
                                className="approval-btn approval-btn-reject"
                                onClick={handleReject}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="approval-container" style={{ backgroundImage: `url(${bg})` }}>
            {renderApproval()}
        </div>
    );
}
