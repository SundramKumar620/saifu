import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import '../styles/RenameAccountModal.css';

export default function RenameAccountModal({ isOpen, onClose, account, onRename }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setName(account.name || `Account ${account.index}`);
    }
  }, [account]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    if (name.trim().length > 30) {
      setError('Account name must be 30 characters or less');
      return;
    }

    onRename(name.trim());
    setName('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  if (!account) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="rename-account-modal">
        <h2 className="modal-title">Rename Account</h2>
        <p className="modal-description">
          Enter a custom name for Account {account.index}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Account Name</label>
            <input
              type="text"
              placeholder={`Account ${account.index}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="name-input"
              autoFocus
              maxLength={30}
            />
            <p className="input-hint">Maximum 30 characters</p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
