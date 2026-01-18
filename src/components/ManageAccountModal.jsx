import React, { useState } from 'react';
import Modal from './Modal';
import '../styles/ManageAccountModal.css';
import { Settings } from "lucide-react"
import { Plus } from "lucide-react"

export default function ManageAccountModal({ isOpen, onClose, onCreateAccount, onAdvancedCreate }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="manage-account-modal">
        <h2 className="modal-title">Create Account</h2>
        <div className="account-options">
          <button className="option-button" onClick={onCreateAccount}>
            <div className="option-icon"><Plus/></div>
            <div className="option-content">
              <h3>Create Account</h3>
              <p>Automatically create a new account</p>
            </div>
          </button>
          <button className="option-button" onClick={onAdvancedCreate}>
            <div className="option-icon"><Settings /></div>
            <div className="option-content">
              <h3>Advanced Create</h3>
              <p>Specify a custom derivation path</p>
            </div>
          </button>
        </div>
        <button className="btn-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

