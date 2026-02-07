import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { TOKENS, getQuote, formatTokenAmount } from '../utils/swapSol';
import '../styles/SwapModal.css';

// Get output tokens (everything except SOL)
const OUTPUT_TOKENS = Object.values(TOKENS).filter(t => t.symbol !== 'SOL');

export default function SwapModal({ isOpen, onClose, onSwap, balance, isLoading }) {
    const [amount, setAmount] = useState('');
    const [selectedToken, setSelectedToken] = useState(OUTPUT_TOKENS[0]);
    const [quote, setQuote] = useState(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setQuote(null);
            setError('');
        }
    }, [isOpen]);

    // Debounced quote fetching
    useEffect(() => {
        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) <= 0) {
                setQuote(null);
                return;
            }

            setQuoteLoading(true);
            setError('');

            try {
                const amountLamports = Math.floor(parseFloat(amount) * Math.pow(10, TOKENS.SOL.decimals));
                const quoteData = await getQuote({
                    inputMint: TOKENS.SOL.mint,
                    outputMint: selectedToken.mint,
                    amount: amountLamports,
                });
                setQuote(quoteData);
            } catch (err) {
                setError('Failed to get quote. Try again.');
                setQuote(null);
            } finally {
                setQuoteLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchQuote, 500);
        return () => clearTimeout(debounceTimer);
    }, [amount, selectedToken]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (balance !== null && amountNum > balance) {
            setError('Insufficient SOL balance');
            return;
        }

        if (!quote) {
            setError('Please wait for quote');
            return;
        }

        onSwap(selectedToken.symbol, amountNum);
    };

    const handleClose = () => {
        if (isLoading) return;
        onClose();
    };

    const handleMaxClick = () => {
        if (balance !== null && balance > 0) {
            // Leave some for transaction fees
            const maxAmount = Math.max(0, balance - 0.01);
            setAmount(maxAmount.toFixed(6));
        }
    };

    const outputAmount = quote
        ? formatTokenAmount(quote.outAmount, selectedToken.decimals)
        : '0';

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="swap-modal">
                <h2 className="modal-title">Swap SOL</h2>

                <form onSubmit={handleSubmit}>
                    {/* From Section */}
                    <div className="swap-section">
                        <div className="swap-section-header">
                            <span className="swap-label">From</span>
                            <span className="swap-balance">
                                Balance: {balance !== null ? balance.toFixed(4) : '...'} SOL
                            </span>
                        </div>
                        <div className="swap-input-row">
                            <input
                                type="number"
                                step="0.000001"
                                min="0"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="swap-amount-input"
                                disabled={isLoading}
                            />
                            <div className="swap-token-badge">
                                <span className="token-icon">◎</span>
                                <span>SOL</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="max-btn-small"
                            onClick={handleMaxClick}
                            disabled={isLoading || balance === null}
                        >
                            MAX
                        </button>
                    </div>

                    {/* Arrow */}
                    <div className="swap-arrow">↓</div>

                    {/* To Section */}
                    <div className="swap-section">
                        <div className="swap-section-header">
                            <span className="swap-label">To (estimated)</span>
                        </div>
                        <div className="swap-input-row">
                            <div className="swap-output-amount">
                                {quoteLoading ? '...' : outputAmount}
                            </div>
                            <select
                                className="swap-token-select"
                                value={selectedToken.symbol}
                                onChange={(e) => {
                                    const token = OUTPUT_TOKENS.find(t => t.symbol === e.target.value);
                                    if (token) setSelectedToken(token);
                                }}
                                disabled={isLoading}
                            >
                                {OUTPUT_TOKENS.map((token) => (
                                    <option key={token.symbol} value={token.symbol}>
                                        {token.symbol}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Quote Details */}
                    {quote && (
                        <div className="swap-details">
                            <div className="swap-detail-row">
                                <span>Rate</span>
                                <span>
                                    1 SOL ≈ {formatTokenAmount(
                                        (quote.outAmount / parseFloat(amount)),
                                        0
                                    )} {selectedToken.symbol}
                                </span>
                            </div>
                            <div className="swap-detail-row">
                                <span>Slippage</span>
                                <span>0.5%</span>
                            </div>
                        </div>
                    )}

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
                            disabled={isLoading || quoteLoading || !quote}
                        >
                            {isLoading ? 'Swapping...' : quoteLoading ? 'Getting Quote...' : 'Swap'}
                        </button>
                    </div>
                </form>

                <div className="swap-powered-by">
                    Powered by Jupiter
                </div>
            </div>
        </Modal>
    );
}
