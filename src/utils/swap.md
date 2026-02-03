// tokens.js
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
    mint: "Es9vMFrzaCERmJfrF4H2FYDk9P5VnKHDyZbbL6iN",
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

// solana.js
import { Connection } from "@solana/web3.js";

export const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);


// quote.js
import fetch from "node-fetch";

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

  if (!json.data || json.data.length === 0) {
    throw new Error("No routes found");
  }

  return json.data[0]; // best route
}

// swapTx.js
import fetch from "node-fetch";

export async function getSwapTransaction(route, userPublicKey) {
  const res = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: route,
      userPublicKey,
      wrapAndUnwrapSol: true,
    }),
  });

  const json = await res.json();

  if (!json.swapTransaction) {
    throw new Error("Swap transaction failed");
  }

  return json.swapTransaction;
}


// send.js
import { VersionedTransaction } from "@solana/web3.js";
import { connection } from "./solana.js";

export async function signAndSendSwap(swapTxBase64, userKeypair) {
  const txBuffer = Buffer.from(swapTxBase64, "base64");
  const transaction = VersionedTransaction.deserialize(txBuffer);

  transaction.sign([userKeypair]);

  const txid = await connection.sendTransaction(transaction);
  await connection.confirmTransaction(txid, "confirmed");

  return txid;
}


// swap.js
import { TOKENS } from "./tokens.js";
import { getQuote } from "./quote.js";
import { getSwapTransaction } from "./swapTx.js";
import { signAndSendSwap } from "./send.js";

export async function swap({
  userKeypair,
  fromSymbol,
  toSymbol,
  amount,
}) {
  const fromToken = TOKENS[fromSymbol];
  const toToken = TOKENS[toSymbol];

  if (!fromToken || !toToken) {
    throw new Error("Unsupported token");
  }

  const amountInSmallestUnit =
    amount * Math.pow(10, fromToken.decimals);

  const route = await getQuote({
    inputMint: fromToken.mint,
    outputMint: toToken.mint,
    amount: Math.floor(amountInSmallestUnit),
  });

  const swapTx = await getSwapTransaction(
    route,
    userKeypair.publicKey.toBase58()
  );

  return await signAndSendSwap(swapTx, userKeypair);
}
