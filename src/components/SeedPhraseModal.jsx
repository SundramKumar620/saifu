import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import '../styles/SeedPhraseModal.css';
import { CircleAlert } from 'lucide-react';

export default function SeedPhraseModal({ isOpen, onClose, seedPhrase, onContinue }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(seedPhrase);
    setCopied(true);
    toast.success('Seed phrase copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="seed-phrase-modal">
        <h2 className="modal-title">Your Recovery Phrase</h2>
        <p className="seed-warning">
          ⚠️ This is very important! Write down these words and keep them safe. 
          You'll need them to recover your wallet.
        </p>
        <div className="seed-phrase-container">
          <div className="seed-phrase-grid">
            {seedPhrase.split(' ').map((word, index) => (
              <div key={index} className="seed-word">
                <span className="seed-word-number">{index + 1}</span>
                <span className="seed-word-text">{word}</span>
              </div>
            ))}
          </div>
        </div>
        <button 
          className={`btn-copy ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? '✓ Copied!' : 'Copy Seed Phrase'}
        </button>
        <div className="modal-actions">
          <button className="btn-continue" onClick={onContinue}>
            I've Saved It
          </button>
        </div>
      </div>
    </Modal>
  );
}

