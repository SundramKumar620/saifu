import React from 'react';
import Modal from './Modal';
import '../styles/DeleteAccountModal.css';

export default function DeleteAccountModal({ isOpen, onClose, account, onConfirm }) {
  const accountDisplayName = account?.name || (account ? `Account ${account.index}` : '');

  if (!account) return null;

  const handleConfirm = () => {
    // Close modal first to trigger closing animation
    onClose();
    // Then perform the delete action after a short delay to allow animation to start
    setTimeout(() => {
      onConfirm();
    }, 100);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="delete-account-modal">
        <h2 className="modal-title">Delete Account</h2>
        <div className="delete-warning">
          <div className="warning-icon">⚠️</div>
          <p className="warning-text">
            Are you sure you want to remove <strong>{accountDisplayName}</strong>?
          </p>
          <p className="warning-description">
            This account will be removed from this device. You can recover it anytime using your backup.
          </p>
        </div>
        <div className="account-info-preview">
          <div className="info-item">
            <span className="info-label">Address:</span>
            <span className="info-value">{account.address}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Derivation Path:</span>
            <span className="info-value">{account.derivationPath}</span>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-delete" onClick={handleConfirm}>
            Remove Account
          </button>
        </div>
      </div>
    </Modal>
  );
}
