import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useWalletStore } from '../store/walletStore';
import { useSessionStore } from '../store/sessionStore';
import { loadEncryptedMnemonic, saveToVault, loadFromVault } from '../db/walletDB';
import { decryptMnemonic } from '../crypto/crypto';
import { deriveAccountLocally, derivePrivateKey } from '../crypto/deriveAccount';
import { getMaxAccountIndex, accountExists } from '../utils/accountUtils';
import PasswordModal from '../components/PasswordModal';
import ManageAccountModal from '../components/ManageAccountModal';
import AdvancedCreateModal from '../components/AdvancedCreateModal';
import RenameAccountModal from '../components/RenameAccountModal';
import DeleteAccountModal from '../components/DeleteAccountModal';
import PrivateKeyModal from '../components/PrivateKeyModal';
import '../styles/WalletInterface.css';
import bg from '../assets/bg.png';
import logo from '../assets/logo.png';
import { Plus, SquarePen,X } from 'lucide-react';

export default function WalletInterface({ onBackupWallet }) {
  const {
    accounts,
    walletLocked,
    unlockWallet,
    lockWallet,
    addAccount,
    deleteAccount,
    selectAccount,
    selectedAccountIndex,
    updateAccountName
  } = useWalletStore();

  const { mnemonic, setMnemonic, clearMnemonic } = useSessionStore();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showManageAccountModal, setShowManageAccountModal] = useState(false);
  const [showAdvancedCreateModal, setShowAdvancedCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);
  const [accountToRename, setAccountToRename] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [passwordModalPurpose, setPasswordModalPurpose] = useState('unlock'); // 'unlock', 'backup', 'privateKey', or 'exportKey'

  // Load selected account index from vault on mount
  useEffect(() => {
    async function loadSelectedAccount() {
      const savedIndex = await loadFromVault('selectedAccountIndex');
      if (savedIndex !== undefined && accounts.some(acc => acc.index === savedIndex)) {
        selectAccount(savedIndex);
      } else if (accounts.length > 0 && selectedAccountIndex === null) {
        // If no saved index or saved index is invalid, default to first account
        const defaultIndex = accounts[0].index;
        selectAccount(defaultIndex);
        await saveToVault('selectedAccountIndex', defaultIndex);
      }
    }
    if (accounts.length > 0) {
      loadSelectedAccount();
    }
  }, [accounts.length]); // Only run when accounts are loaded

  const mainAccount = accounts.find(acc => acc.index === selectedAccountIndex) || accounts[0];
  // Show ALL accounts in manage account section, not just non-selected ones
  const allAccounts = accounts;

  const handleUnlock = async (password) => {
    try {
      const encrypted = await loadEncryptedMnemonic();
      const decryptedMnemonic = await decryptMnemonic(encrypted, password);
      setMnemonic(decryptedMnemonic);
      unlockWallet();
      setShowPasswordModal(false);
      setTimeout(() => {
        toast.success('Wallet unlocked successfully');
      }, 300);
    } catch {
      toast.error('Wrong password');
    }
  };

  const handleLock = () => {
    clearMnemonic();
    lockWallet();
    toast.success('Wallet locked');
  };

  const handleBackupWallet = () => {
    setPasswordModalPurpose('backup');
    setShowPasswordModal(true);
  };

  const handleBackupPassword = async (password) => {
    try {
      const encrypted = await loadEncryptedMnemonic();
      const decryptedMnemonic = await decryptMnemonic(encrypted, password);
      setShowPasswordModal(false);
      onBackupWallet(decryptedMnemonic);
    } catch {
      toast.error('Wrong password');
    }
  };

  const handlePrivateKeyClick = () => {
    // Always ask for password for better security, even if wallet is unlocked
    setPasswordModalPurpose('privateKey');
    setShowPasswordModal(true);
  };

  const handlePrivateKeyPassword = async (password) => {
    try {
      const encrypted = await loadEncryptedMnemonic();
      const decryptedMnemonic = await decryptMnemonic(encrypted, password);
      // Derive private key after password verification
      const accountIndex = mainAccount?.index || 0;
      const derivedPrivateKey = derivePrivateKey(decryptedMnemonic, accountIndex);
      setPrivateKey(derivedPrivateKey);
      
      // Close password modal and immediately open private key modal
      // Same pattern as ManageAccountModal → AdvancedCreateModal
      setShowPasswordModal(false);
      setShowPrivateKeyModal(true);
    } catch {
      toast.error('Wrong password');
    }
  };

  const handleExportKey = () => {
    // Always ask for password for better security, even if wallet is unlocked
    setPasswordModalPurpose('exportKey');
    setShowPasswordModal(true);
  };

  const handleExportKeyPassword = async (password) => {
    try {
      const encrypted = await loadEncryptedMnemonic();
      const decryptedMnemonic = await decryptMnemonic(encrypted, password);
      // Derive private key after password verification
      const accountIndex = mainAccount?.index || 0;
      const derivedPrivateKey = derivePrivateKey(decryptedMnemonic, accountIndex);

      const keyData = {
        privateKey: derivedPrivateKey,
        address: mainAccount?.address,
        name: mainAccount?.name || `Account ${mainAccount?.index}`,
        derivationPath: mainAccount?.derivationPath,
      };

      const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saifu-key-${mainAccount?.address}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowPasswordModal(false);
      toast.success('Key exported successfully');
    } catch {
      toast.error('Wrong password');
    }
  };


  const handleCreateAccount = async () => {
    if (walletLocked) {
      toast.error('Unlock wallet first');
      return;
    }

    const nextIndex = getMaxAccountIndex(accounts) + 1;
    const newAccount = await deriveAccountLocally(mnemonic, nextIndex);
    // Add default name
    newAccount.name = `Account ${nextIndex}`;
    addAccount(newAccount);
    await saveToVault('accounts', [...accounts, newAccount]);
    setShowManageAccountModal(false);
    setTimeout(() => {
      toast.success(`Account ${nextIndex} created successfully`);
    }, 300);
  };

  const handleAdvancedCreate = async (index) => {
    if (walletLocked) {
      toast.error('Unlock wallet first');
      return;
    }

    if (accountExists(accounts, index)) {
      toast.error(`Account ${index} already exists`);
      return;
    }

    const newAccount = await deriveAccountLocally(mnemonic, index);
    // Add default name
    newAccount.name = `Account ${index}`;
    addAccount(newAccount);
    await saveToVault('accounts', [...accounts, newAccount]);
    setShowAdvancedCreateModal(false);
    setShowManageAccountModal(false);
    setTimeout(() => {
      toast.success(`Account ${index} created successfully`);
    }, 300);
  };

  const handleDeleteAccountClick = (account) => {
    if (accounts.length === 1) {
      toast.error('Cannot delete last account');
      return;
    }
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    const index = accountToDelete.index;
    const wasSelected = selectedAccountIndex === index;
    deleteAccount(index);
    const updated = accounts.filter(a => a.index !== index);
    await saveToVault('accounts', updated);

    // If deleted account was selected, save the new selected index
    if (wasSelected && updated.length > 0) {
      const newSelectedIndex = updated[0].index;
      await saveToVault('selectedAccountIndex', newSelectedIndex);
    }

    setAccountToDelete(null);
    setTimeout(() => {
      toast.success('Account deleted successfully');
    }, 300);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleRenameAccount = (account) => {
    setAccountToRename(account);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async (newName) => {
    if (accountToRename) {
      updateAccountName(accountToRename.index, newName);
      const updatedAccounts = accounts.map(acc =>
        acc.index === accountToRename.index ? { ...acc, name: newName } : acc
      );
      await saveToVault('accounts', updatedAccounts);
      setAccountToRename(null);
      setTimeout(() => {
        toast.success('Account renamed successfully');
      }, 300);
    }
  };

  const getAccountDisplayName = (account) => {
    return account.name || `Account ${account.index}`;
  };

  return (
    <div className="wallet-interface" style={{ backgroundImage: `url(${bg})` }}>
      <div className="wallet-card glassmorphism">
        <div className="wallet-header">
          <div className="logo-container">
            <div className="logo">
              <img src={logo} alt="Saifu Logo" />
            </div>
          </div>
          <h1 className="wallet-title">Welcome to Saifu</h1>
          <p className="wallet-subtitle">Solana HD Wallet</p>
        </div>

        <div className="main-account-section">
          <h2 className="section-title">Main Account</h2>
          <div className="address-container">
            <input
              type="text"
              value={mainAccount?.address || ''}
              readOnly
              className="address-input"
            />
            <div className="address-actions">
              <button
                className="action-btn"
                onClick={() => copyToClipboard(mainAccount?.address)}
              >
                Copy
              </button>
              <button className="action-btn" onClick={handleExportKey}>Export Key</button>
              <button 
                className="action-btn"
                onClick={handlePrivateKeyClick}
              >
                Private Key
              </button>
            </div>
          </div>
        </div>

        <div className="manage-account-section">
          <div className="section-header">
            <h2 className="section-title">Manage Account</h2>
            <button
              className="add-account-btn"
              onClick={() => setShowManageAccountModal(true)}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="accounts-list">
            {allAccounts.map((account) => (
              <div
                key={account.index}
                className={`account-item ${selectedAccountIndex === account.index ? 'selected-account' : ''}`}
              >
                <div
                  className="account-info"
                  onClick={async () => {
                    selectAccount(account.index);
                    await saveToVault('selectedAccountIndex', account.index);
                  }}
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  <span className="account-label">{getAccountDisplayName(account)}</span>
                  <span className="account-address">{account.address}</span>
                  <span className="account-path">{account.derivationPath}</span>
                </div>
                <div className="account-actions">
                  <button
                    className="edit-account-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameAccount(account);
                    }}
                    title="Rename account"
                  >
                    <SquarePen size={14} />
                  </button>
                  {allAccounts.length > 1 && (
                    <button
                      className="delete-account-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccountClick(account);
                      }}
                      title="Delete account"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {allAccounts.length === 0 && (
              <p className="no-accounts">No accounts</p>
            )}
          </div>
        </div>

        <div className="wallet-actions">
          {walletLocked ? (
            <button
              className="btn-lock"
              onClick={() => {
                setPasswordModalPurpose('unlock');
                setShowPasswordModal(true);
              }}
            >
              Unlock Wallet
            </button>
          ) : (
            <button className="btn-lock" onClick={handleLock}>
              Lock Wallet
            </button>
          )}
          <button className="btn-backup" onClick={handleBackupWallet}>
            Backup Wallet
          </button>
        </div>
      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={
          passwordModalPurpose === 'unlock' 
            ? handleUnlock 
            : passwordModalPurpose === 'backup' 
            ? handleBackupPassword 
            : passwordModalPurpose === 'privateKey'
            ? handlePrivateKeyPassword
            : handleExportKeyPassword
        }
        title={
          passwordModalPurpose === 'unlock' 
            ? 'Enter Wallet Password' 
            : passwordModalPurpose === 'backup' 
            ? 'Enter Password to Backup' 
            : passwordModalPurpose === 'privateKey'
            ? 'Enter Password to View Private Key'
            : 'Enter Password to Export Key'
        }
      />

      <ManageAccountModal
        isOpen={showManageAccountModal}
        onClose={() => setShowManageAccountModal(false)}
        onCreateAccount={handleCreateAccount}
        onAdvancedCreate={() => {
          setShowManageAccountModal(false);
          setShowAdvancedCreateModal(true);
        }}
      />

      <AdvancedCreateModal
        isOpen={showAdvancedCreateModal}
        onClose={() => setShowAdvancedCreateModal(false)}
        onSubmit={handleAdvancedCreate}
      />

      <RenameAccountModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          // Clear account after animation completes
          setTimeout(() => {
            setAccountToRename(null);
          }, 400);
        }}
        account={accountToRename}
        onRename={handleRenameSubmit}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          // Clear account after animation completes
          setTimeout(() => {
            setAccountToDelete(null);
          }, 400);
        }}
        account={accountToDelete}
        onConfirm={handleDeleteConfirm}
      />

      <PrivateKeyModal
        isOpen={showPrivateKeyModal}
        onClose={() => {
          setShowPrivateKeyModal(false);
          setTimeout(() => {
            setPrivateKey(null);
          }, 300);
        }}
        privateKey={privateKey}
      />
    </div>
  );
}

