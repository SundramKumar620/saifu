import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useWalletStore } from "./store/walletStore";
import { saveToVault, loadFromVault, saveEncryptedMnemonic, loadEncryptedMnemonic, clearVault } from "./db/walletDB";
import { encryptMnemonic, decryptMnemonic } from "./crypto/crypto";
import { useSessionStore } from "./store/sessionStore";
import { deriveAccountLocally } from "./crypto/deriveAccount";
import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import HeroSection from "./pages/HeroSection";
import LandingPage from "./pages/LandingPage";
import WalletInterface from "./pages/WalletInterface";
import PasswordModal from "./components/PasswordModal";
import LoadingModal from "./components/LoadingModal";
import SeedPhraseModal from "./components/SeedPhraseModal";
import ImportWalletModal from "./components/ImportWalletModal";
import BackupWalletModal from "./components/BackupWalletModal";
import "./App.css";

export default function App() {
  const { walletExists, setWallet, selectAccount } = useWalletStore();
  const { setMnemonic } = useSessionStore();

  const [showHeroSection, setShowHeroSection] = useState(true);
  const [showCreatePasswordModal, setShowCreatePasswordModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Creating wallet...");
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [generatedSeedPhrase, setGeneratedSeedPhrase] = useState("");

  useEffect(() => {
    async function restore() {
      const accounts = await loadFromVault("accounts");
      if (accounts && accounts.length > 0) {
        setWallet(accounts);
        setShowHeroSection(false); // Skip hero section if wallet exists
        const savedIndex = await loadFromVault("selectedAccountIndex"); // Restore selected account index
        if (savedIndex !== undefined && accounts.some(acc => acc.index === savedIndex)) {
          selectAccount(savedIndex);
        } else {
          selectAccount(accounts[0].index); // Default to first account
          await saveToVault("selectedAccountIndex", accounts[0].index);
        }
      }
    }
    restore();
  }, [setWallet, selectAccount]);

  const handleCreateWallet = () => {
    setShowCreatePasswordModal(true);
  };

  const handleCreatePasswordSubmit = async (password) => {
    setShowCreatePasswordModal(false);
    setLoadingMessage("Creating wallet...");
    setShowLoadingModal(true);

    // a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // 1️ Generate mnemonic (client-side)
      const mnemonic = generateMnemonic(wordlist);
      setGeneratedSeedPhrase(mnemonic);

      // 2️ Encrypt mnemonic
      const encrypted = await encryptMnemonic(mnemonic, password);
      await saveEncryptedMnemonic(encrypted);

      // 3️ Derive first account (index 0)
      const account0 = await deriveAccountLocally(mnemonic, 0);
      // Add default name
      account0.name = 'Account 0';
      const accounts = [account0];

      // 4️ Store accounts
      await saveToVault("accounts", accounts);
      setWallet(accounts);

      // Set first account as selected
      selectAccount(account0.index);
      await saveToVault("selectedAccountIndex", account0.index);

      // 5️ Keep mnemonic ONLY in memory
      setMnemonic(mnemonic);

      setShowLoadingModal(false);
      setShowSeedPhraseModal(true);
    } catch (error) {
      setShowLoadingModal(false);
      toast.error("Failed to create wallet. Please try again.");
    }
  };

  const handleSeedPhraseContinue = () => {
    setShowSeedPhraseModal(false);
    setGeneratedSeedPhrase("");
    setTimeout(() => {
      toast.success("Wallet created successfully!");
    }, 300);
  };

  const handleImportWallet = () => {
    setShowImportModal(true);
  };

  const handleImportSubmit = async (mnemonic, password) => {
    setShowImportModal(false);
    setLoadingMessage("Importing wallet...");
    setShowLoadingModal(true);

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // 1️ Validate mnemonic
      if (!validateMnemonic(mnemonic, wordlist)) {
        setShowLoadingModal(false);
        toast.error("Invalid mnemonic phrase");
        return;
      }

      // 2️ Encrypt & store
      const encrypted = await encryptMnemonic(mnemonic, password);
      await saveEncryptedMnemonic(encrypted);

      // 3️ Derive first account
      const account0 = await deriveAccountLocally(mnemonic, 0);
      // Add default name
      account0.name = 'Account 0';
      const accounts = [account0];

      await saveToVault("accounts", accounts);
      setWallet(accounts);

      // Set first account as selected
      selectAccount(account0.index);
      await saveToVault("selectedAccountIndex", account0.index);

      // 4️ Keep mnemonic only in RAM
      setMnemonic(mnemonic);

      setShowLoadingModal(false);
      toast.success("Wallet imported successfully!");
    } catch (error) {
      setShowLoadingModal(false);
      toast.error("Failed to import wallet. Please check your recovery phrase and try again.");
    }
  };

  const handleBackupWallet = (mnemonic) => {
    setGeneratedSeedPhrase(mnemonic);
    setShowBackupModal(true);
  };

  const handleBackupClose = () => {
    setShowBackupModal(false);
    setGeneratedSeedPhrase("");
  };

  const handleGetStarted = () => {
    setShowHeroSection(false);
  };

  return (
    <div className="app">
      {showHeroSection ? (
        <HeroSection onGetStarted={handleGetStarted} />
      ) : !walletExists ? (
        <LandingPage
          onCreateWallet={handleCreateWallet}
          onImportWallet={handleImportWallet}
        />
      ) : (
        <WalletInterface onBackupWallet={handleBackupWallet} />
      )}

      <PasswordModal
        isOpen={showCreatePasswordModal}
        onClose={() => setShowCreatePasswordModal(false)}
        onSubmit={handleCreatePasswordSubmit}
        title="Set Wallet Password"
      />

      <LoadingModal
        isOpen={showLoadingModal}
        message={loadingMessage}
      />

      <SeedPhraseModal
        isOpen={showSeedPhraseModal}
        onClose={() => {
          setShowSeedPhraseModal(false);
          setGeneratedSeedPhrase("");
        }}
        seedPhrase={generatedSeedPhrase}
        onContinue={handleSeedPhraseContinue}
      />

      <ImportWalletModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSubmit={handleImportSubmit}
      />

      <BackupWalletModal
        isOpen={showBackupModal}
        onClose={handleBackupClose}
        seedPhrase={generatedSeedPhrase}
      />

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(30, 30, 40, 0.95)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          },
          success: {
            iconTheme: {
              primary: '#4caf50',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff6b6b',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  );
}
