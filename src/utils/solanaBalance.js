import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection(
  "https://devnet.helius-rpc.com/?api-key=15fed2f6-7bb6-4ecd-ab74-62aebb6f71f8",
  "confirmed"
);

export async function getSolBalance(address) {
  const publicKey = new PublicKey(address);

  const balanceLamports = await connection.getBalance(publicKey);

  const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

  return balanceSOL;
}
