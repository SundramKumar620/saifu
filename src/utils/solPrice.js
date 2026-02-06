import { API_ENDPOINTS } from "../config/config.js";

export async function getSolPriceUsd() {
  try {
    const res = await fetch(API_ENDPOINTS.SOL_PRICE);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.price;
  } catch (error) {
    console.error("Error fetching SOL price:", error);
    return null;
  }
}

