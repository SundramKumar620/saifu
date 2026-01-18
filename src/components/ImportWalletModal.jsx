import React, { useState } from 'react';
import Modal from './Modal';
import '../styles/ImportWalletModal.css';

export default function ImportWalletModal({ isOpen, onClose, onSubmit }) {
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!mnemonic.trim()) {
      setError('Recovery phrase is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    onSubmit(mnemonic.trim(), password);
    setMnemonic('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    setMnemonic('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="import-wallet-modal">
        <h2 className="modal-title">Import Wallet</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Recovery Phrase</label>
            <textarea
              placeholder="Enter your 12 or 24 word recovery phrase"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              className="mnemonic-input"
              rows="4"
            />
          </div>
          <div className="input-group">
            <label>Set Wallet Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
            />
          </div>
          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="password-input"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Import Wallet
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

