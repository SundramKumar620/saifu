import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { API_ENDPOINTS } from "../config/config.js";

// Use backend RPC proxy instead of direct Helius connection
const connection = new Connection(
    API_ENDPOINTS.RPC_PROXY,
    "confirmed"
);

/**
 * Send SOL from one account to another
 * @param {string} privateKeyBase58 - The sender's private key in base58 format
 * @param {string} toAddress - The recipient's public address
 * @param {number} amountSol - The amount of SOL to send
 * @returns {Promise<string>} - The transaction signature
 */
export async function sendSol(privateKeyBase58, toAddress, amountSol) {
    // Decode the private key
    const secretKey = bs58.decode(privateKeyBase58);
    const fromKeypair = Keypair.fromSecretKey(secretKey);

    // Validate recipient address
    let toPublicKey;
    try {
        toPublicKey = new PublicKey(toAddress);
    } catch {
        throw new Error("Invalid recipient address");
    }

    // Convert SOL to lamports
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

    if (lamports <= 0) {
        throw new Error("Amount must be greater than 0");
    }

    // Create the transaction
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toPublicKey,
            lamports: lamports,
        })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromKeypair.publicKey;

    // Sign and send the transaction
    transaction.sign(fromKeypair);
    const signature = await connection.sendRawTransaction(transaction.serialize());

    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed");

    return signature;
}
