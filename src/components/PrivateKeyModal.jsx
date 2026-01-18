import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import '../styles/PrivateKeyModal.css';
import { Eye, EyeOff, Copy } from 'lucide-react';

export default function PrivateKeyModal({ isOpen, onClose, privateKey }) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      setCopied(true);
      toast.success('Private key copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setCopied(false);
    onClose();
  };

  if (!privateKey) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="private-key-modal">
        <h2 className="modal-title">Private Key</h2>
        <p className="private-key-warning">
          ⚠️ Keep your private key secure and never share it with anyone. 
          Anyone with access to this key can control your account.
        </p>
        
        <div className="private-key-container">
          <div className="private-key-display">
            {isVisible ? (
              <div className="private-key-value">
                {privateKey}
              </div>
            ) : (
              <div className="private-key-hidden">
                <span className="hidden-dots">••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••</span>
              </div>
            )}
          </div>
          
          <div className="private-key-actions">
            <button
              className="toggle-visibility-btn"
              onClick={() => setIsVisible(!isVisible)}
              title={isVisible ? 'Hide private key' : 'Show private key'}
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              className={`copy-key-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              <Copy size={16} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-continue" onClick={handleClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
