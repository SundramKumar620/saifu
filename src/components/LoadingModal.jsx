import React from 'react';
import Modal from './Modal';
import '../styles/LoadingModal.css';

export default function LoadingModal({ isOpen, message = "Creating wallet..." }) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <div className="loading-modal">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </Modal>
  );
}

