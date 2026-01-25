import { mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { HDKey } from "micro-ed25519-hdkey";
import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

 //Derive Solana account locally (browser-safe, SLIP-0010)

export function deriveAccountLocally(mnemonic, accountIndex) {
    if (!mnemonic) {
        throw new Error("Wallet locked");
    }

    // 1 mnemonic → seed (512-bit)
    const seed = mnemonicToSeedSync(mnemonic);

    // 2️ create HD root (ed25519 SLIP-0010)
    const hd = HDKey.fromMasterSeed(seed);

    // 3️ Solana derivation path (hardened)
    const path = `m/44'/501'/${accountIndex}'/0'`;

    const child = hd.derive(path);

    // 4️ ed25519 keypair
    const keypair = nacl.sign.keyPair.fromSeed(child.privateKey);

    // 5️ Solana address
    const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey);

    return {
        index: accountIndex,
        address: solanaKeypair.publicKey.toBase58(),
        derivationPath: path,
    };
}

 //Derive private key from mnemonic and account index

export function derivePrivateKey(mnemonic, accountIndex) {
    if (!mnemonic) {
        throw new Error("Wallet locked");
    }

    // 1️ mnemonic → seed (512-bit)
    const seed = mnemonicToSeedSync(mnemonic);

    // 2️ create HD root (ed25519 SLIP-0010)
    const hd = HDKey.fromMasterSeed(seed);

    // 3️ Solana derivation path (hardened)
    const path = `m/44'/501'/${accountIndex}'/0'`;

    const child = hd.derive(path);

    // 4️ ed25519 keypair
    const keypair = nacl.sign.keyPair.fromSeed(child.privateKey);

    // 5️ Solana keypair
    const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey);

    // 6️ Return private key as base58 string (Solana standard format)
    // The secretKey is 64 bytes: first 32 bytes are the private key, last 32 bytes are the public key
    // For Solana wallets, we export the full 64-byte secretKey as base58
    return bs58.encode(solanaKeypair.secretKey);
}