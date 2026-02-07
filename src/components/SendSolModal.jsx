import React, { useState } from 'react';
import Modal from './Modal';
import '../styles/SendSolModal.css';

export default function SendSolModal({ isOpen, onClose, onSend, balance, isLoading }) {
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!recipientAddress.trim()) {
            setError('Recipient address is required');
            return;
        }

        if (recipientAddress.length < 32 || recipientAddress.length > 44) {
            setError('Invalid Solana address');
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (balance !== null && amountNum > balance) {
            setError('Insufficient balance');
            return;
        }

        onSend(recipientAddress.trim(), amountNum);
    };

    const handleClose = () => {
        setRecipientAddress('');
        setAmount('');
        setError('');
        onClose();
    };

    const handleMaxClick = () => {
        if (balance !== null && balance > 0) {
            // Leave a small amount for transaction fees (0.000005 SOL)
            const maxAmount = Math.max(0, balance - 0.000005);
            setAmount(maxAmount.toFixed(9));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="send-sol-modal">
                <h2 className="modal-title">Send SOL</h2>

                <div className="balance-display">
                    <span className="balance-label">Available Balance:</span>
                    <span className="balance-value">
                        {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                    </span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Recipient Address</label>
                        <input
                            type="text"
                            placeholder="Enter Solana address"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            className="send-input"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Amount (SOL)</label>
                        <div className="amount-input-wrapper">
                            <input
                                type="number"
                                step="0.000000001"
                                min="0"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="send-input amount-input"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="max-btn"
                                onClick={handleMaxClick}
                                disabled={isLoading || balance === null}
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
