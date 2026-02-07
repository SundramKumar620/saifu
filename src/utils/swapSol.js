import { Connection, VersionedTransaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { API_ENDPOINTS } from "../config/config.js";

// Tokens configuration
export const TOKENS = {
  SOL: {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
  },
  USDC: {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
  USDT: {
    symbol: "USDT",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
  },
  JUP: {
    symbol: "JUP",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    decimals: 6,
  },
  BONK: {
    symbol: "BONK",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
  },
};

// Use backend RPC proxy (Note: Jupiter works on mainnet, backend should proxy to mainnet for swaps)
const connection = new Connection(
  API_ENDPOINTS.RPC_PROXY,
  "confirmed"
);

/**
 * Get a swap quote from Jupiter
 */
export async function getQuote({
  inputMint,
  outputMint,
  amount,
  slippageBps = 50,
}) {
  const url =
    `https://quote-api.jup.ag/v6/quote?` +
    `inputMint=${inputMint}` +
    `&outputMint=${outputMint}` +
    `&amount=${amount}` +
    `&slippageBps=${slippageBps}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.error) {
    throw new Error(json.error);
  }

  return json;
}

/**
 * Get the swap transaction from Jupiter
 */
export async function getSwapTransaction(quoteResponse, userPublicKey) {
  const res = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
    }),
  });

  const json = await res.json();

  if (!json.swapTransaction) {
    throw new Error(json.error || "Swap transaction failed");
  }

  return json.swapTransaction;
}

/**
 * Sign and send the swap transaction
 */
export async function signAndSendSwap(swapTxBase64, privateKeyBase58) {
  // Decode private key and create keypair
  const secretKey = bs58.decode(privateKeyBase58);
  const keypair = Keypair.fromSecretKey(secretKey);

  // Deserialize and sign transaction
  const txBuffer = Buffer.from(swapTxBase64, "base64");
  const transaction = VersionedTransaction.deserialize(txBuffer);
  transaction.sign([keypair]);

  // Send transaction
  const txid = await connection.sendTransaction(transaction, {
    skipPreflight: true,
    maxRetries: 2,
  });

  // Wait for confirmation
  await connection.confirmTransaction(txid, "confirmed");

  return txid;
}

/**
 * Execute a complete swap
 * @param {string} privateKeyBase58 - User's private key in base58
 * @param {string} fromSymbol - Token symbol to swap from (e.g., "SOL")
 * @param {string} toSymbol - Token symbol to swap to (e.g., "USDC")
 * @param {number} amount - Amount to swap in human readable format (e.g., 1.5 for 1.5 SOL)
 */
export async function swap({
  privateKeyBase58,
  fromSymbol,
  toSymbol,
  amount,
}) {
  const fromToken = TOKENS[fromSymbol];
  const toToken = TOKENS[toSymbol];

  if (!fromToken || !toToken) {
    throw new Error("Unsupported token");
  }

  // Get user's public key from private key
  const secretKey = bs58.decode(privateKeyBase58);
  const keypair = Keypair.fromSecretKey(secretKey);
  const userPublicKey = keypair.publicKey.toBase58();

  // Convert amount to smallest unit
  const amountInSmallestUnit = Math.floor(amount * Math.pow(10, fromToken.decimals));

  // Get quote from Jupiter
  const quoteResponse = await getQuote({
    inputMint: fromToken.mint,
    outputMint: toToken.mint,
    amount: amountInSmallestUnit,
  });

  // Get swap transaction
  const swapTx = await getSwapTransaction(quoteResponse, userPublicKey);

  // Sign and send
  return await signAndSendSwap(swapTx, privateKeyBase58);
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount, decimals) {
  return (amount / Math.pow(10, decimals)).toFixed(decimals > 4 ? 4 : decimals);
}
