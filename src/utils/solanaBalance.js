import { API_ENDPOINTS } from "../config/config.js";

export async function getSolBalance(address) {
  try {
    const res = await fetch(API_ENDPOINTS.SOL_BALANCE(address));
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.balance;
  } catch (error) {
    console.error("Error fetching SOL balance:", error);
    throw error;
  }
}

