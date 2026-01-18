import React from 'react';
import '../styles/LandingPage.css';
import bg from '../assets/bg.png';
import logo from '../assets/logo.png';

export default function LandingPage({ onCreateWallet, onImportWallet }) {
  return (
    <div className="landing-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="landing-card">
        <div className="logo-container">
          <div className="logo">
            <img src={logo} alt="Saifu Logo" />
          </div>
        </div>
        <h1 className="landing-title">Welcome to Saifu</h1>
        <p className="landing-subtitle">Create or import a wallet to get started</p>

        <div className="landing-buttons">
          <button className="btn-primary" onClick={onCreateWallet}>
            Create Wallet
          </button>
          <button className="btn-secondary" onClick={onImportWallet}>
            Import Wallet
          </button>
        </div>

        <div className="landing-footer">
          <span>Solana HD Wallet | What is HD Wallet?</span>
        </div>
      </div>
    </div>
  );
}

