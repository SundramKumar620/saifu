import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { API_ENDPOINTS } from "../config/config.js";

const connection = new Connection(
  API_ENDPOINTS.RPC_PROXY,
  "confirmed"
);

export async function getSolBalance(address) {
  try {
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error fetching SOL balance:", error);
    throw error;
  }
}
