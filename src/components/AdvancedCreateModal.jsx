import React, { useState } from 'react';
import Modal from './Modal';
import '../styles/AdvancedCreateModal.css';

export default function AdvancedCreateModal({ isOpen, onClose, onSubmit }) {
  const [derivationPath, setDerivationPath] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!derivationPath.trim()) {
      setError('Derivation path is required');
      return;
    }

    const index = Number(derivationPath.trim());
    if (!Number.isInteger(index) || index < 0) {
      setError('Please enter a valid positive number (e.g., 1, 2, 3)');
      return;
    }

    onSubmit(index);
    setDerivationPath('');
    setError('');
  };

  const handleClose = () => {
    setDerivationPath('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="advanced-create-modal">
        <h2 className="modal-title">Advanced Create Account</h2>
        <p className="modal-description">
          Enter a derivation path index (e.g., 1, 2, 3) to create an account.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Derivation Path Index</label>
            <input
              type="text"
              placeholder="e.g., 1 or 2"
              value={derivationPath}
              onChange={(e) => setDerivationPath(e.target.value)}
              className="derivation-input"
              autoFocus
            />
            <p className="input-hint">Path will be: m/44'/501'/{derivationPath || 'X'}'/0'</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Account
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

