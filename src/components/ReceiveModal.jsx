import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import Modal from './Modal';
import '../styles/ReceiveModal.css';

export default function ReceiveModal({ isOpen, onClose, address }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        toast.success('Address copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="receive-modal">
                <h2 className="modal-title">Receive SOL</h2>

                <div className="qr-container">
                    <QRCode
                        value={address}
                        size={200}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                    />
                </div>

                <div className="receive-address-container">
                    <label className="input-label" style={{
                        display: 'block',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px',
                        marginBottom: '8px',
                        fontWeight: '500'
                    }}>Your Wallet Address</label>

                    <div className="address-box" onClick={handleCopy}>
                        <span className="address-text">{address}</span>
                        <div className="copy-icon">
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>
                        Close
                    </button>
                    <button className="btn-submit" onClick={handleCopy}>
                        {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
