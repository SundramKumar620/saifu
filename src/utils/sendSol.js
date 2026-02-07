// frontend/src/utils/sendSol.js
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { API_ENDPOINTS } from "../config/config.js";

// Use backend proxy for HTTP RPC calls only (no WebSocket)
const connection = new Connection(
    API_ENDPOINTS.RPC_PROXY,
    {
        commitment: "confirmed",
        disableRetryOnRateLimit: false,
    }
);

/**
 * Poll for transaction confirmation using getSignatureStatuses
 * @param {string} signature - Transaction signature
 * @param {number} timeoutSeconds - Maximum time to wait in seconds
 * @returns {Promise<void>}
 */
async function confirmTransactionPolling(signature, timeoutSeconds = 30) {
    return new Promise((resolve, reject) => {
        const pollInterval = 1000; // Poll every 1 second
        const startTime = Date.now();
        let attempt = 0;
        let intervalId; // Declare intervalId here so it's accessible for clearInterval

        const checkStatus = async () => {
            attempt++;
            const elapsed = Math.floor((Date.now() - startTime) / 1000);

            try {
                const { value } = await connection.getSignatureStatuses([signature]);
                const status = value[0];

                if (status) {
                    // Check if confirmed or finalized
                    if (status.confirmationStatus === 'confirmed' ||
                        status.confirmationStatus === 'finalized') {

                        clearInterval(intervalId);

                        // Check for transaction errors
                        if (status.err) {
                            reject(new Error(`Transaction failed: ${JSON.stringify(status.err)} `));
                            return;
                        }

                        resolve();
                        return;
                    }
                }

                // Check timeout
                if (elapsed >= timeoutSeconds) {
                    clearInterval(intervalId);
                    reject(new Error(`Transaction confirmation timeout after ${timeoutSeconds} s.Signature: ${signature} `));
                }

            } catch (error) {
                if (error.message.includes('Transaction failed')) {
                    clearInterval(intervalId);
                    reject(error);
                    return;
                }
            }
        };

        // Start polling immediately, then every interval
        checkStatus();
        intervalId = setInterval(checkStatus, pollInterval);
    });
}

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
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromKeypair.publicKey;

    // Sign and send the transaction
    transaction.sign(fromKeypair);
    const signature = await connection.sendRawTransaction(transaction.serialize());

    await confirmTransactionPolling(signature, 30);

    return signature;
}