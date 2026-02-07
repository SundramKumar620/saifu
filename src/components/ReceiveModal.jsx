import React, { useState } from 'react';
import Modal from './Modal';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import '../styles/ReceiveModal.css';

export default function ReceiveModal({ isOpen, onClose, address }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            toast.success('Address copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Failed to copy address');
        }
    };

    const handleClose = () => {
        setCopied(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="receive-modal">
                <h2 className="modal-title">Receive SOL</h2>

                <p className="receive-description">
                    Scan QR code or copy address to receive SOL
                </p>

                {/* QR Code */}
                <div className="qr-code-container">
                    <QRCodeSVG
                        value={address}
                        size={280}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                    />
                </div>

                {/* Address Display */}
                <div className="address-display">
                    <div className="address-label">Your Address</div>
                    <div className="address-text">{address}</div>
                </div>

                {/* Action Buttons */}
                <div className="modal-actions">
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={handleClose}
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        className="btn-submit"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <Check size={18} />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy size={18} />
                                <span>Copy Address</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
