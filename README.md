Perfect, this is already solid — I’ll **polish it**, **simplify wording**, **remove repetition**, and **clearly state Devnet usage** while keeping it professional and GitHub-ready.
Below is a **clean, improved README** you can paste directly.

---

# Saifu — Solana HD Wallet (Web + Extension)

**Saifu** is a Solana HD wallet built as a **web application with a browser extension layer**.
Users can create or import wallets using a mnemonic, manage accounts, and connect to Solana dApps via an injected provider — following the same interaction model as popular Solana wallets.

> ⚠️ **Network:** Saifu currently operates on **Solana Devnet only**.

---

## Key features

* Create and import HD wallets (BIP39 mnemonic)
* Mnemonic **never leaves the frontend**
* Encrypted mnemonic storage using **IndexedDB**
* Password-based lock / unlock mechanism
* Mnemonic is loaded into **memory (RAM) only when unlocked**
* Web wallet UI for managing accounts
* Browser extension injects `window.solana` for dApp connectivity
* Optional backend for RPC helpers and services

---

## Network configuration

* **Solana Network:** `devnet`
* Used for:

  * Wallet creation and testing
  * dApp connections
  * Transaction signing
* This project is intended for **development and learning purposes**
* Do **not** use with real funds

---

## Project layout (high level)

* `saifu/`
  Frontend wallet + extension source
  (UI, wallet logic, encryption, provider injection)

* `saifu-backend/`
  Optional backend for RPC helpers and services
  (see `.env.example` in backend repo)

### Branches

* `main` — stable branch (devnet, tested features)
* `dev` — active development for web wallet
* `extension` — browser extension–specific work

---

## Security design

Security is **frontend-first**.

### Mnemonic handling

* Mnemonic is generated or imported **in the browser**
* Encrypted using a user-defined password
* Stored only in **IndexedDB**
* **Never** sent to backend or external servers

### Lock / unlock flow

* **Locked**

  * No mnemonic in memory
  * Only encrypted data exists locally
* **Unlocked**

  * Mnemonic is decrypted
  * Loaded into RAM temporarily
  * Used for key derivation and signing
* On lock, refresh, or close → mnemonic is removed from memory

### Backend trust model

* Backend never receives:

  * mnemonic
  * private keys
  * passwords
* Backend only handles:

  * RPC helpers
  * public keys
  * signed transactions (if needed)

---

## How users use Saifu

### Create wallet

1. User sets a password
2. Mnemonic is generated locally
3. Mnemonic is encrypted and stored in IndexedDB
4. Public address is derived and shown

### Import wallet

1. User enters an existing mnemonic
2. Mnemonic is encrypted with password
3. Stored locally in IndexedDB

### Lock & unlock

* Lock clears mnemonic from memory
* Unlock decrypts mnemonic for signing

### Connect to dApps

* dApps request connection using `window.solana`
* User approves connection
* Public key is shared
* Transactions require explicit approval

---

## Backend (separate repository)

Backend code lives here:
👉 [https://github.com/SundramKumar620/saifu-backend](https://github.com/SundramKumar620/saifu-backend)

Backend responsibilities:

* RPC proxy / helpers
* Optional indexing or analytics
* Network utilities

Frontend works independently without backend.

---

## API (backend – example)

> Replace with real endpoints from `saifu-backend`

* `GET /health` — service status
* `POST /rpc/proxy` — RPC forwarding
* `GET /price/:token` — token price helper

---

## Contributing

* Fork the repo
* Create a branch from `dev`
* Submit PRs to `dev` or `extension`
* Follow secure coding practices for browser crypto
* Update README if behavior changes

---

## Known limitations & TODOs

* No hardware wallet support
* No WebSocket subscriptions yet
---

## Disclaimer

This project is under active development.
It is **not audited**.
Use **Devnet only** and do not store real funds.

