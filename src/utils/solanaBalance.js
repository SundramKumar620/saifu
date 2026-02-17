import { API_ENDPOINTS } from "../config/config.js";
import { getTokens } from "./getTokens.js";

export async function getSolBalance(address) {
  const res = await fetch(API_ENDPOINTS.SOL_BALANCE(address));

  if (!res.ok) {
    throw new Error(`Failed to fetch SOL balance: ${res.statusText}`);
  }

  const data = await res.json();
  return data.balance ?? 0;
}

export async function getWalletData(address) {
  const [balance, tokens] = await Promise.all([
    getSolBalance(address),
    getTokens(address),
  ]);

  return { balance, tokens };
}
