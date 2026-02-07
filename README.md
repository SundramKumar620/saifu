# Saifu — Solana HD Wallet (Web + Extension)

**Short description**
Saifu is a Solana HD wallet implemented as a web app + browser extension. Users can create or import wallets (mnemonic-based), manage accounts, and connect to dApps via a provider injected by the extension (same UX pattern as common Solana wallets).

---

## Key features

* Create / import HD wallets (BIP39 mnemonic) in the browser.
* Mnemonic **never** leaves the frontend; stored encrypted in IndexedDB.
* Password-based encryption, with lock/unlock functionality that loads the mnemonic into RAM only when unlocked.
* Web app for wallet management, plus a browser extension that injects `window.solana` to enable dApp connections (similar to how popular wallets work: Phantom and Backpack).
* Backend (optional) for RPC and additional services (your backend repo). ([GitHub][1])

---

## Project layout (high level)

* `saifu/` — frontend + extension source (UI, wallet logic, extension manifest).
* `saifu-backend/` — server-side code for RPC helpers, indexing, analytics, etc. (see `.env.example` in backend).
* Branches:

  * `main` — stable / production-ready (RPC config + stable features)
  * `dev` — active development for the web app
  * `extension` — extension-specific code and builds

---

## Security design (read carefully)

* **Mnemonic storage**: mnemonic is encrypted with a user-chosen password and stored in **IndexedDB** on the client. It is **never** sent to the backend or remote servers.
* **Unlock workflow**: when the user unlocks with the password, the mnemonic is decrypted and loaded **into RAM** for wallet operations; when locked, it is cleared from memory.
* **Threat model**: browser local storage / IndexedDB can be targeted by XSS; minimize attack surface by:

  * Avoiding `eval` / unsafe inline scripts.
  * Using Content Security Policy (CSP) for your hosted web app.
  * Keeping dependencies up to date and auditing packages.
* **Backend trust**: do not send mnemonic, private keys, or raw seed phrases to backend endpoints. Only send signed transactions or public keys.

---

## Quick start — development

### Prereqs

* Node.js (v16+ recommended)
* npm / yarn
* Chrome / Chromium for extension testing

### Frontend (dev)

```bash
# from saifu/
npm install
npm run dev
# or
yarn
yarn dev
```

### Backend (dev)

(see `saifu-backend/.env.example` in the backend repo for required env vars). Example:

```bash
# from saifu-backend/
cp .env.example .env
# set environment variables
npm install
node server.js
# or
npm run start
```

(Your backend repo already contains `server.js` and a `.env.example` file — keep secrets in environment variables). ([GitHub][2])

---

## Extension — load in Chrome (development)

1. Build the extension bundle (replace with your actual build command):

   ```bash
   npm run build:extension
   ```
2. Open `chrome://extensions/`, enable **Developer mode**.
3. Click **Load unpacked**, choose your extension `dist/` or `build/` folder (where `manifest.json` lives).
4. The extension injects a provider at `window.solana` used by dApps to request connection/signing.

**Note:** dApp detection expects an injected provider at `window.solana`. Ensure provider API matches the standard Solana wallet adapter methods.

---

## How to use (user flows)

* **Create wallet** — user sets password → generates mnemonic → encrypt & store in IndexedDB → show derived public address(es).
* **Import wallet** — user pastes mnemonic → password to encrypt → store in IndexedDB.
* **Lock / Unlock** — Lock clears mnemonic from RAM. Unlock decrypts from IndexedDB into RAM for signing.
* **Connect to dApp** — when a dApp calls `window.solana.connect()`, the extension UI prompts the user to approve connection and account selection.

---

## API (backend) — example endpoints

*(Put the actual endpoints from your backend here; below are placeholders — replace with your real routes from `saifu-backend`.)*

* `GET /health` — health check
* `POST /rpc/proxy` — proxy RPC calls (if you use a middle layer for rate limiting)
* `GET /price/:token` — token price helpers

## Contributing

* Fork → branch from `dev` → PR to `dev` (or `extension` if change is extension-specific).
* Follow secure coding guidelines for web crypto and browser extension best practices.
* Add changelog entries and update the README when adding new features.

---

Disclaimer

This project is under active development.
Use at your own risk.
Do not store large amounts until fully audited.

## Known limitations & TODOs

* Improve UI for multiple accounts and account derivation paths.
* Add hardware wallet support (e.g., Ledger)
* Add Websocket
